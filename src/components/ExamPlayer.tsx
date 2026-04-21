import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Award,
  ChevronRight,
  ShieldCheck,
  Timer
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface ExamPlayerProps {
  examId: string;
  userData: any;
  onBack: () => void;
  onFinish: (score: number, passed: boolean, certificateId?: string) => void;
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

interface Exam {
  id: string;
  title: string;
  time_limit: number;
  passing_score: number;
  is_final: boolean;
  course_id: string;
}

export function ExamPlayer({ examId, userData, onBack, onFinish }: ExamPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; certificateId?: string } | null>(null);

  const [alreadyPassed, setAlreadyPassed] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<{ score: number } | null>(null);

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished && !alreadyPassed) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isFinished, alreadyPassed]);

  async function fetchExamData() {
    try {
      setLoading(true);

      // Check if already passed
      const { data: existingPass } = await supabase
        .from('exam_submissions')
        .select('score')
        .eq('exam_id', examId)
        .eq('user_id', userData.id)
        .eq('passed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingPass) {
        setAlreadyPassed(true);
        setLastSubmission(existingPass);
      }

      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      setExam(examData);
      setTimeLeft(examData.time_limit * 60);

      const { data: questionsData, error: qError } = await supabase
        .from('questions')
        .select(`
          id,
          text,
          alternatives (
            id,
            text,
            is_correct
          )
        `)
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (qError) throw qError;
      setQuestions(questionsData || []);

    } catch (error: any) {
      toast.error('Erro ao carregar prova: ' + error.message);
      onBack();
    } finally {
      setLoading(false);
    }
  }

  const handleSelectAlternative = (questionId: string, alternativeId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: alternativeId }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach(q => {
      const selectedAltId = answers[q.id];
      const correctAlt = q.alternatives.find(a => a.is_correct);
      if (selectedAltId && selectedAltId === correctAlt?.id) {
        correctCount++;
      }
    });
    return Math.round((correctCount / questions.length) * 100);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      const score = calculateScore();
      const passed = score >= (exam?.passing_score || 70);

      // Save submission
      const { data: submission, error: subError } = await supabase
        .from('exam_submissions')
        .insert({
          exam_id: examId,
          user_id: userData.id,
          score,
          passed
        })
        .select()
        .single();

      if (subError) throw subError;

      let certificateId;
      // If passed and is final exam, generate certificate
      if (passed && exam?.is_final) {
        toast.loading('Gerando certificado oficial...', { id: 'cert-gen' });
        
        const { data: certificate, error: certError } = await supabase
          .from('certificates')
          .insert({
            user_id: userData.id,
            course_id: exam.course_id,
            issue_date: new Date().toISOString()
          })
          .select()
          .single();

        if (certError) {
          console.error('Error generating certificate:', certError);
          toast.error(`Erro ao emitir certificado: ${certError.message}`, { id: 'cert-gen', duration: 5000 });
        } else {
          certificateId = certificate.id;
          toast.success('Certificado gerado com sucesso!', { id: 'cert-gen' });
        }
      }

      setResult({ score, passed, certificateId });
      setIsFinished(true);
      if (passed) {
        // Only show success if it wasn't already shown by certificate or if no certificate was expected
        if (!exam?.is_final) {
          toast.success('Parabéns! Você foi aprovado.');
        }
      } else {
        toast.error('Sua pontuação foi insuficiente para a aprovação.');
      }
    } catch (error: any) {
      toast.error('Erro ao enviar prova: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0b0e] gap-4">
        <Loader2 className="w-12 h-12 text-[#22ff88] animate-spin" />
        <p className="text-[#64748b] font-bold uppercase tracking-[0.3em] text-[10px]">Validando Credenciais Técnicas...</p>
      </div>
    );
  }

  if (alreadyPassed && lastSubmission) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0b0e] p-6 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-[#1a1c22] border border-white/5 rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 blur-[100px] opacity-20 bg-[#22ff88]" />

          <div className="relative z-10 space-y-8">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto border shadow-2xl bg-[#22ff88]/10 border-[#22ff88]/30 text-[#22ff88]">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Prova Concluída</h2>
              <p className="text-[#64748b] font-bold uppercase tracking-widest text-[10px]">
                Você já foi aprovado nesta avaliação.
              </p>
            </div>

            <div className="py-6 border-y border-white/5">
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Seu Score Anterior</p>
              <p className="text-4xl font-black text-[#22ff88]">
                {lastSubmission.score}%
              </p>
            </div>

            <button 
              onClick={() => onBack()}
              className="w-full py-5 bg-white/5 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all text-xs uppercase tracking-widest border border-white/5"
            >
              VOLTAR AO CURSO
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isFinished && result) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0b0e] p-6 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-[#1a1c22] border border-white/5 rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className={cn(
            "absolute -top-24 -left-24 w-48 h-48 blur-[100px] opacity-20",
            result.passed ? "bg-[#22ff88]" : "bg-red-500"
          )} />

          <div className="relative z-10 space-y-8">
            <div className={cn(
              "w-24 h-24 rounded-3xl flex items-center justify-center mx-auto border shadow-2xl",
              result.passed 
                ? "bg-[#22ff88]/10 border-[#22ff88]/30 text-[#22ff88]" 
                : "bg-red-500/10 border-red-500/30 text-red-500"
            )}>
              {result.passed ? <Award className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
            </div>

            <div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">
                {result.passed ? "MENSAGEM DE APROVAÇÃO" : "AVALIAÇÃO NÃO CONCLUÍDA"}
              </h2>
              <p className="text-[#64748b] font-bold uppercase tracking-widest text-[10px]">
                {exam?.title}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-6 border-y border-white/5">
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Seu Score</p>
                <p className={cn("text-4xl font-black", result.passed ? "text-[#22ff88]" : "text-red-500")}>
                  {result.score}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Mínimo Exigido</p>
                <p className="text-4xl font-black text-white">
                  {exam?.passing_score}%
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {result.passed && result.certificateId ? (
                <button 
                  onClick={() => onFinish(result.score, result.passed, result.certificateId)}
                  className="w-full py-5 bg-[#22ff88] text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(34,255,136,0.2)]"
                >
                  <Award className="w-4 h-4" />
                  VER MEU CERTIFICADO
                </button>
              ) : (
                <button 
                  onClick={() => onBack()}
                  className="w-full py-5 bg-white/5 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all text-xs uppercase tracking-widest border border-white/5"
                >
                  VOLTAR AO CURSO
                </button>
              )}
              
              {!result.passed && (
                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">
                  Não desanime! Revise o conteúdo e tente novamente.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIdx];
  const progress = ((currentQuestionIdx + 1) / questions.length) * 100;

  return (
    <div className="h-screen flex flex-col bg-[#0a0b0e] overflow-hidden">
      {/* Exam Header */}
      <header className="p-6 md:p-10 border-b border-white/5 bg-[#0f1115] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-[#22ff88]/10 rounded-2xl flex items-center justify-center border border-[#22ff88]/20">
            <Timer className="w-6 h-6 text-[#22ff88]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">{exam?.title}</h1>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-[#22ff88] uppercase tracking-widest">Em progresso</span>
              <div className="w-[1px] h-3 bg-white/10" />
              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
                Questão {currentQuestionIdx + 1} de {questions.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Timer Desktop */}
          <div className="hidden md:flex flex-col items-end">
             <span className="text-[8px] font-black text-[#64748b] uppercase tracking-[0.2em] mb-1">Tempo Restante</span>
             <span className={cn(
               "text-2xl font-black tabular-nums transition-colors",
               timeLeft < 60 ? "text-red-500 animate-pulse" : "text-white"
             )}>
               {formatTime(timeLeft)}
             </span>
          </div>
          <button 
            onClick={onBack}
            className="p-3 bg-white/5 rounded-xl border border-white/10 text-[#64748b] hover:text-white transition-all"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-white/5 relative">
        <motion.div 
          className="absolute h-full bg-[#22ff88] shadow-[0_0_15px_rgba(34,255,136,0.3)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 flex justify-center bg-[#0a0b0e]/50">
        <div className="max-w-4xl w-full py-8 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion?.id || 'loading'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 md:space-y-12"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-[1px] w-8 bg-[#22ff88]/30" />
                  <span className="text-[10px] md:text-xs font-black text-[#22ff88] uppercase tracking-[0.3em]">Questão {currentQuestionIdx + 1}</span>
                </div>
                <h2 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tight">
                  {currentQuestion?.text || "Carregando enunciado..."}
                </h2>
              </div>

              <div className="grid gap-4">
                {currentQuestion?.alternatives.map((alt, idx) => {
                  const isSelected = answers[currentQuestion.id] === alt.id;
                  return (
                    <button
                      key={alt.id}
                      onClick={() => handleSelectAlternative(currentQuestion.id, alt.id)}
                      className={cn(
                        "group w-full p-6 md:p-8 rounded-2xl md:rounded-3xl border text-left transition-all duration-300 flex items-center gap-6",
                        isSelected 
                          ? "bg-[#22ff88]/10 border-[#22ff88]/50 shadow-[0_0_30px_rgba(34,255,136,0.05)]" 
                          : "bg-[#1a1c22] border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center font-black transition-all",
                        isSelected 
                          ? "bg-[#22ff88] border-[#22ff88] text-black" 
                          : "bg-[#0f1115] border-white/10 text-white/20 group-hover:border-[#22ff88]/30 group-hover:text-[#22ff88]"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={cn(
                        "flex-1 text-sm md:text-lg font-bold transition-colors",
                        isSelected ? "text-white" : "text-white/60 group-hover:text-white"
                      )}>
                        {alt.text}
                      </span>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected ? "border-[#22ff88] bg-[#22ff88]/20" : "border-white/10"
                      )}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#22ff88]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Timer Footer */}
      <div className="md:hidden p-4 bg-[#0f1115] border-t border-white/5 flex justify-between items-center">
         <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">Tempo Restante</span>
         <span className={cn(
           "text-xl font-black tabular-nums",
           timeLeft < 60 ? "text-red-500 animate-pulse" : "text-white"
         )}>
           {formatTime(timeLeft)}
         </span>
      </div>

      {/* Navigation Footer */}
      <footer className="p-6 md:p-10 border-t border-white/5 bg-[#0f1115] flex justify-between items-center shrink-0">
        <button
          onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIdx === 0}
          className="px-6 md:px-10 py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-3 uppercase tracking-widest text-[10px] md:text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </button>

        {currentQuestionIdx === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || !answers[currentQuestion?.id]}
            className="px-8 md:px-12 py-4 bg-[#22ff88] text-black font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest text-[10px] md:text-xs shadow-[0_0_25px_rgba(34,255,136,0.1)] disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Finalizar Exame
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={!answers[currentQuestion?.id]}
            className="px-8 md:px-12 py-4 bg-[#22ff88] text-black font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest text-[10px] md:text-xs shadow-[0_0_25px_rgba(34,255,136,0.1)] disabled:opacity-50"
          >
            Próximo
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </footer>
    </div>
  );
}
