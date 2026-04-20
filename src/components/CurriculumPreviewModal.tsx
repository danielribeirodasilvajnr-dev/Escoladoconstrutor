import { useState, useEffect } from 'react';
import { motion} from 'motion/react';
import { X, Lock, Play, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CurriculumPreviewModalProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

export function CurriculumPreviewModal({ courseId, courseTitle, onClose }: CurriculumPreviewModalProps) {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            duration
          )
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (error) throw error;
      
      // Sort lessons by order_index manually if needed, 
      // but usually Supabase does it if we define it in the schema or query
      const sortedModules = (data || []).map(m => ({
        ...m,
        lessons: (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      setModules(sortedModules);
    } catch (error) {
      console.error('Erro ao buscar currículo:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[85vh] bg-[#0a0b0e] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-[#22ff88]" />
              <span className="text-[10px] font-bold text-[#22ff88] uppercase tracking-[0.2em]">Conteúdo do Treinamento</span>
            </div>
            <h3 className="text-2xl font-bold text-white leading-tight">{courseTitle}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#64748b] hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-[#22ff88] animate-spin" />
              <p className="text-[#64748b] text-[10px] font-bold uppercase tracking-widest">Carregando Grade...</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <BookOpen className="w-12 h-12 mx-auto mb-4" />
              <p className="text-sm font-medium">Nenhum módulo cadastrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {modules.map((module, mIdx) => (
                <div key={module.id} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                  <div className="p-5 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-mono text-white/20">{String(mIdx + 1).padStart(2, '0')}</span>
                      <h4 className="font-bold text-white">{module.title}</h4>
                    </div>
                    <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                      {module.lessons?.length || 0} Aulas
                    </span>
                  </div>
                  <div className="p-2 space-y-1">
                    {module.lessons?.map((lesson: any) => (
                      <div key={lesson.id} className="flex items-center justify-between p-3.5 hover:bg-white/[0.03] rounded-2xl transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-white/10 group-hover:border-[#22ff88]/30 transition-colors">
                            <Lock className="w-3 h-3 text-[#64748b] group-hover:text-[#22ff88]/50" />
                          </div>
                          <p className="text-xs font-semibold text-[#94a3b8] group-hover:text-white transition-colors">{lesson.title}</p>
                        </div>
                        <span className="text-[9px] font-bold text-[#64748b] uppercase font-mono">{lesson.duration || '--:--'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-black/40 backdrop-blur-xl border-t border-white/5">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-[#22ff88] text-black font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(34,255,136,0.1)]"
          >
            Começar Agora
          </button>
        </div>
      </motion.div>
    </div>
  );
}
