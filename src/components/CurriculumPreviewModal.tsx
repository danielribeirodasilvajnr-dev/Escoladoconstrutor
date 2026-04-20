import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Loader2, BookOpen, ChevronDown, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CurriculumPreviewModalProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
  onAction?: () => void;
}

export function CurriculumPreviewModal({ courseId, courseTitle, onClose, onAction }: CurriculumPreviewModalProps) {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCurriculum();
  }, [courseId]);

  async function fetchCurriculum() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          lessons (
            id,
            title,
            duration,
            order_index
          )
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (error) throw error;
      
      const sortedModules = (data || []).map(m => ({
        ...m,
        lessons: (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      setModules(sortedModules);
      
      // Expand first module by default
      if (sortedModules.length > 0) {
        setExpandedModules(new Set([sortedModules[0].id]));
      }
    } catch (error) {
      console.error('Erro ao buscar currículo:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[85vh] bg-[#0a0b0e] rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-6 border-b border-white/5 flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#22ff88]/10 flex items-center justify-center border border-[#22ff88]/20">
                <BookOpen className="w-4 h-4 text-[#22ff88]" />
              </div>
              <span className="text-[10px] font-black text-[#22ff88] uppercase tracking-[0.2em]">Conteúdo do Treinamento</span>
            </div>
            <h3 className="text-3xl font-black text-white leading-tight tracking-tight">{courseTitle}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-3 text-[#64748b] hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-12 h-12 text-[#22ff88] animate-spin" />
              <p className="text-[#64748b] text-[11px] font-black uppercase tracking-[0.3em]">Mapeando Grade Curricular...</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-24 opacity-40">
              <BookOpen className="w-16 h-16 mx-auto mb-6 text-[#64748b]" />
              <p className="text-sm font-bold uppercase tracking-widest text-[#64748b]">Nenhum módulo disponível</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module, mIdx) => {
                const isOpen = expandedModules.has(module.id);
                const moduleKey = `module-${mIdx}`;
                
                return (
                  <div 
                    key={moduleKey} 
                    className={`bg-white/[0.02] border transition-all duration-300 rounded-3xl overflow-hidden ${
                      isOpen ? 'border-white/10 ring-1 ring-white/5' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <button 
                      onClick={() => toggleModule(module.id)}
                      className="w-full p-6 flex justify-between items-center text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                           <ChevronDown 
                             className={`w-4 h-4 text-orange-500 transition-transform duration-300 ${isOpen ? '' : '-rotate-90'}`} 
                             strokeWidth={3}
                           />
                           <span className="text-xl font-black text-white/20 tracking-tighter">
                             {String(mIdx + 1).padStart(2, '0')}
                           </span>
                        </div>
                        <h4 className="font-black text-white text-lg tracking-tight group-hover:text-[#22ff88] transition-colors">
                          {module.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="hidden sm:block text-[9px] font-black text-[#64748b] uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                          {module.lessons?.length || 0} Aulas
                        </span>
                      </div>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key={`module-content-${mIdx}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="px-4 pb-4 space-y-1">
                            <div className="bg-black/40 rounded-2xl p-2 border border-white/5">
                              {module.lessons?.map((lesson: any, lIdx: number) => (
                                <div 
                                  key={`lesson-${mIdx}-${lIdx}`} 
                                  className="flex items-center justify-between p-4 hover:bg-white/[0.05] rounded-xl transition-all group/lesson cursor-pointer"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/lesson:border-[#22ff88]/30 transition-colors">
                                      <Lock className="w-4 h-4 text-[#64748b] group-hover/lesson:text-[#22ff88] transition-all" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-[#94a3b8] group-hover/lesson:text-white transition-colors">{lesson.title}</p>
                                      <span className="sm:hidden text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{lesson.duration || '--:--'} min</span>
                                    </div>
                                  </div>
                                  <span className="hidden sm:block text-[10px] font-black text-[#64748b] font-mono group-hover/lesson:text-[#22ff88] transition-colors">{lesson.duration || '--:--'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-8 bg-black/60 backdrop-blur-md border-t border-white/10 flex flex-col items-center">
          <button 
            onClick={onAction || onClose}
            className="w-full py-5 bg-[#22ff88] text-black font-black rounded-2xl text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(34,255,136,0.15)] flex items-center justify-center gap-3 group"
          >
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            Começar Agora
          </button>
          <p className="text-[9px] text-[#64748b] font-bold uppercase tracking-widest mt-6">
            Acesso vitalício garantido para membros Construtor360
          </p>
        </div>
      </motion.div>
    </div>
  );
}
