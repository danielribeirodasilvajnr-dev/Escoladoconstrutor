import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Star,
  Shield,
  Trash2,
  Plus,
  CheckCircle2,
  Info,
  FileText,
  Upload,
  ChevronDown,
  Award,
  Layers,
  Save,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ExamCreatorProps {
  userData: any;
  initialCourseId?: string;
  initialModuleId?: string | null;
  onBack?: () => void;
}

interface Alternative {
  id: string;
  text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  text: string;
  alternatives: Alternative[];
}

export function ExamCreator({ userData, initialCourseId, initialModuleId, onBack }: ExamCreatorProps) {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);

  // Exam Info
  const [targetCourse, setTargetCourse] = useState("");
  const [targetModule, setTargetModule] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("60");
  const [passingScore, setPassingScore] = useState("70");
  const [attempts, setAttempts] = useState("1");

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: Math.random().toString(),
      text: '',
      alternatives: [
        { id: Math.random().toString(), text: '', is_correct: true },
        { id: Math.random().toString(), text: '', is_correct: false },
        { id: Math.random().toString(), text: '', is_correct: false },
      ]
    }
  ]);

  useEffect(() => {
    fetchCourses();
    
    if (initialCourseId) {
      setTargetCourse(initialCourseId);
    }
    
    if (initialModuleId) {
      setTargetModule(initialModuleId);
      setIsFinal(false);
    } else if (initialModuleId === null && initialCourseId) {
      // If moduleId is explicitly null but courseId exists, it's a final exam
      setIsFinal(true);
    }
  }, [initialCourseId, initialModuleId]);

  useEffect(() => {
    if (targetCourse) {
      fetchModules(targetCourse);
    } else {
      setModules([]);
      setTargetModule("");
    }
  }, [targetCourse]);

  async function fetchCourses() {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .eq('instructor_id', userData.id);
    setCourses(data || []);
  }

  async function fetchModules(courseId: string) {
    const { data } = await supabase
      .from('modules')
      .select('id, title')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    setModules(data || []);
  }

  const addQuestion = () => {
    setQuestions([...questions, {
      id: Math.random().toString(),
      text: '',
      alternatives: [
        { id: Math.random().toString(), text: '', is_correct: true },
        { id: Math.random().toString(), text: '', is_correct: false },
        { id: Math.random().toString(), text: '', is_correct: false },
      ]
    }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const updateAlternative = (qId: string, aId: string, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          alternatives: q.alternatives.map(a => a.id === aId ? { ...a, text } : a)
        };
      }
      return q;
    }));
  };

  const setCorrectAlternative = (qId: string, aId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          alternatives: q.alternatives.map(a => ({ ...a, is_correct: a.id === aId }))
        };
      }
      return q;
    }));
  };

  const addAlternative = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          alternatives: [...q.alternatives, { id: Math.random().toString(), text: '', is_correct: false }]
        };
      }
      return q;
    }));
  };

  const removeAlternative = (qId: string, aId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId && q.alternatives.length > 2) {
        return {
          ...q,
          alternatives: q.alternatives.filter(a => a.id !== aId)
        };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    if (!targetCourse) {
      toast.error("Por favor, selecione um curso para a prova.");
      return;
    }
    
    if (!title) {
       toast.error("Por favor, defina um título para a prova.");
       return;
    }

    try {
      setLoading(true);

      // 1. Create the Exam
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          course_id: targetCourse,
          module_id: isFinal ? null : (targetModule || null),
          title,
          time_limit: parseInt(timeLimit),
          passing_score: parseInt(passingScore),
          attempts_allowed: attempts === 'Única tentativa' ? 1 : attempts === '2 Tentativas' ? 2 : 99,
          is_final: isFinal
        })
        .select()
        .single();

      if (examError) throw examError;

      // 2. Create Questions and Alternatives
      for (const q of questions) {
        const { data: question, error: qError } = await supabase
          .from('questions')
          .insert({
            exam_id: exam.id,
            text: q.text,
            order_index: questions.indexOf(q)
          })
          .select()
          .single();

        if (qError) throw qError;

        const alternativesToInsert = q.alternatives.map(a => ({
          question_id: question.id,
          text: a.text,
          is_correct: a.is_correct
        }));

        const { error: aError } = await supabase
          .from('alternatives')
          .insert(alternativesToInsert);

        if (aError) throw aError;
      }

      toast.success("Prova publicada com sucesso!");
      // Reset form or navigate back
    } catch (error: any) {
      console.error("Erro ao salvar prova:", error.message);
      toast.error("Erro ao publicar prova. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-[1600px] mx-auto pb-20">
      <header className="flex flex-col lg:flex-row justify-between lg:items-end mb-8 md:mb-12 gap-8">
        <div className="max-w-2xl">
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-1.5 text-[#64748b] hover:text-white transition-colors mb-4 md:mb-6 group"
            >
              <Plus className="w-3.5 h-3.5 rotate-45 transform" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Voltar</span>
            </button>
          )}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 md:w-10 md:h-10 bg-[#22ff88]/10 rounded-xl flex items-center justify-center border border-[#22ff88]/20">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-[#22ff88]" />
            </span>
            <h2 className="text-[10px] font-black text-[#22ff88] uppercase tracking-[0.2em]">Exam Factory</h2>
          </div>
          <h1 className="text-2xl md:text-5xl font-black text-white mb-3 md:mb-4 leading-tight">
            Criar Nova <span className="text-[#22ff88]">Avaliação</span>
          </h1>
          <p className="text-[#64748b] text-sm md:text-base leading-relaxed">
            Configure o escopo da avaliação, defina os parâmetros de aprovação e construa as questões técnicas.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 lg:flex-none px-6 py-3.5 bg-transparent border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-all uppercase tracking-widest text-[9px] md:text-[11px]">
            Rascunho
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 lg:flex-none px-8 py-3.5 bg-[#22ff88] text-black font-black rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,255,136,0.1)] flex items-center justify-center gap-2 uppercase tracking-widest text-[9px] md:text-[11px]"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Publicar
          </button>
        </div>
      </header>

      {/* Configuration Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
        {/* Course Select */}
        <div className="bg-[#1a1c22] p-5 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-3.5 h-3.5 text-[#22ff88]" />
            <h3 className="text-[8px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Curso Vinculado</h3>
          </div>
          <select
            value={targetCourse}
            onChange={(e) => setTargetCourse(e.target.value)}
            disabled={!!initialCourseId}
            className={cn(
              "w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3.5 text-white font-bold text-sm focus:outline-none transition-all appearance-none",
              initialCourseId ? "opacity-60 cursor-not-allowed border-none" : "hover:border-[#22ff88]/30 cursor-pointer"
            )}
          >
            <option value="">Selecione o Curso</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        {/* Scope Toggle */}
        <div className="bg-[#1a1c22] p-5 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-3.5 h-3.5 text-[#00ffcc]" />
            <h3 className="text-[8px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Escopo</h3>
          </div>
          <div className="flex p-1 bg-[#0f1115] rounded-xl border border-white/5">
            <button
              onClick={() => setIsFinal(false)}
              disabled={initialCourseId !== undefined}
              className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${!isFinal ? 'bg-[#22ff88] text-black shadow-lg' : 'text-[#64748b] hover:text-white'} ${initialCourseId !== undefined ? 'pointer-events-none' : ''}`}
            >
              Módulo
            </button>
            <button
              onClick={() => setIsFinal(true)}
              disabled={initialCourseId !== undefined}
              className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${isFinal ? 'bg-[#22ff88] text-black shadow-lg' : 'text-[#64748b] hover:text-white'} ${initialCourseId !== undefined ? 'pointer-events-none' : ''}`}
            >
              Final
            </button>
          </div>
        </div>

        {/* Target Module / Certificate Info */}
        <div className="bg-[#1a1c22] p-5 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 space-y-3">
          {isFinal ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-3.5 h-3.5 text-[#ffcc00]" />
                <h3 className="text-[8px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Certificação</h3>
              </div>
              <div className="p-3 bg-[#ffcc00]/10 border border-[#ffcc00]/20 rounded-xl">
                <p className="text-[10px] text-[#ffcc00] font-bold uppercase text-center">Gera Certificado após Provação</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <ChevronDown className="w-3.5 h-3.5 text-[#00ffcc]" />
                <h3 className="text-[8px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Módulo</h3>
              </div>
              <select
                value={targetModule}
                onChange={(e) => setTargetModule(e.target.value)}
                disabled={initialModuleId !== undefined}
                className={cn(
                  "w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-2.5 text-white font-bold text-xs focus:outline-none transition-all appearance-none",
                  initialModuleId !== undefined ? "opacity-60 cursor-not-allowed border-none" : "hover:border-[#22ff88]/30 cursor-pointer"
                )}
              >
                <option value="">Todos os Módulos</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-[#1a1c22] p-8 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <h3 className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Título da Prova</h3>
          </div>
          <input
            type="text"
            placeholder="Ex: Avaliação de Solo Nível 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus={!title}
            className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[#22ff88]/30 transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Parameters Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#1a1c22] p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/5 space-y-6 md:space-y-8">
            <h3 className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.2em] mb-3 md:mb-4">Parâmetros</h3>

            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#22ff88]" />
                <span className="text-[8px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Tempo (Min)</span>
              </div>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-lg md:text-xl focus:outline-none focus:border-[#22ff88]/30 transition-all"
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-[#22ff88]" />
                <span className="text-[8px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Aprovação (0-100)</span>
              </div>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-lg md:text-xl focus:outline-none focus:border-[#22ff88]/30 transition-all"
              />
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#22ff88]" />
                <span className="text-[8px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Tentativas</span>
              </div>
              <select
                value={attempts}
                onChange={(e) => setAttempts(e.target.value)}
                className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-xs md:text-sm focus:outline-none appearance-none"
              >
                <option>Única tentativa</option>
                <option>2 Tentativas</option>
                <option>Ilimitado</option>
              </select>
            </div>
          </div>

          <div className="bg-[#1a1c22] p-8 rounded-[2.5rem] border border-white/5">
            <div className="flex items-center gap-4 mb-8">
              <Plus className="w-5 h-5 text-[#22ff88]" />
              <h3 className="text-sm font-bold text-white">Documentos de Apoio</h3>
            </div>
            <div className="bg-[#0f1115] border border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:bg-white/5 transition-all">
              <Upload className="w-8 h-8 text-[#64748b] mx-auto mb-4" />
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Anexar material técnico</p>
            </div>
          </div>
        </div>

        {/* Questions Main Area */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1c22] p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-white/5 relative group"
            >
              <div className="flex justify-between items-center mb-6 md:mb-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-[#0f1115] border border-white/5 rounded-xl flex items-center justify-center text-[#22ff88] font-black italic text-xs md:text-base">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-base md:text-xl font-bold text-white">Questão</h3>
                    <p className="text-[8px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Múltipla Escolha</p>
                  </div>
                </div>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="p-3 bg-red-500/5 text-red-400 opacity-0 group-hover:opacity-100 rounded-xl hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 md:space-y-8">
                <div>
                  <label className="text-[9px] md:text-[10px] font-extrabold text-[#64748b] uppercase tracking-[0.2em] mb-2 md:mb-4 block">Enunciado</label>
                  <textarea
                    value={q.text}
                    onChange={(e) => updateQuestionText(q.id, e.target.value)}
                    placeholder="Descreva a questão..."
                    className="w-full bg-[#0f1115] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 text-white text-sm md:text-lg min-h-[100px] md:min-h-[140px] focus:outline-none focus:border-[#22ff88]/30 transition-all resize-none"
                  />
                </div>

                <div className="space-y-4 md:space-y-6">
                  <label className="text-[9px] md:text-[10px] font-extrabold text-[#64748b] uppercase tracking-[0.2em] mb-2 block">Alternativas</label>
                  <div className="space-y-3 md:space-y-4">
                    {q.alternatives.map((alt, aIdx) => (
                      <div key={alt.id} className="flex gap-3 md:gap-4 items-center group/item">
                        <button
                          onClick={() => setCorrectAlternative(q.id, alt.id)}
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl border flex items-center justify-center transition-all ${alt.is_correct ? 'bg-[#22ff88] border-[#22ff88] text-black shadow-[0_0_15px_rgba(34,255,136,0.2)]' : 'bg-[#0f1115] border-white/5 text-[#64748b] hover:border-[#22ff88]/30'}`}
                        >
                          {alt.is_correct ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : <span className="text-[8px] md:text-[10px] font-black uppercase text-inherit">{String.fromCharCode(65 + aIdx)}</span>}
                        </button>
                        <input
                          type="text"
                          value={alt.text}
                          onChange={(e) => updateAlternative(q.id, alt.id, e.target.value)}
                          className="flex-1 bg-[#0f1115] border border-white/5 rounded-lg md:rounded-xl px-4 py-2.5 md:py-4 text-white text-xs md:text-sm focus:outline-none focus:border-[#22ff88]/30 transition-all"
                          placeholder="Opção..."
                        />
                        <button
                          onClick={() => removeAlternative(q.id, alt.id)}
                          className="p-2 text-[#64748b] hover:text-red-400 md:opacity-0 md:group-hover/item:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addAlternative(q.id)}
                      className="flex items-center gap-3 text-[10px] font-black text-[#22ff88] uppercase tracking-[0.15em] pt-4 hover:translate-x-2 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Alternativa
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <button
            onClick={addQuestion}
            className="w-full py-10 bg-[#0f1115] border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-[#64748b] hover:border-[#22ff88]/40 hover:text-white transition-all group"
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-[#22ff88]/10 group-hover:text-[#22ff88] transition-all">
              <Plus className="w-8 h-8" />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.2em]">Adicionar Nova Questão Técnica</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
