import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  Users, 
  Star, 
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  Globe,
  Award,
  Lock,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { CheckoutModal } from './CheckoutModal';

interface PublicCourseViewProps {
  courseId: string;
  onBack: () => void;
  onAuth: () => void;
  session: any;
}

export function PublicCourseView({ courseId, onBack, onAuth, session }: PublicCourseViewProps) {
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourseData();
    if (session?.user?.id) {
       checkEnrollment();
    }
  }, [courseId, session]);

  async function fetchCourseData() {
    try {
      setLoading(true);
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!instructor_id (
            full_name,
            avatar_url,
            bio
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: modulesData } = await supabase
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

      setModules(modulesData || []);
    } catch (error) {
       console.error('Erro ao carregar curso:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkEnrollment() {
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('course_id', courseId)
      .maybeSingle();
    
    if (data) setIsEnrolled(true);
  }

  const handleCTA = () => {
    if (course?.is_blocked) return;

    if (isEnrolled) {
       onBack(); // Go to dashboard/courses
       return;
    }

    if (!session) {
       onAuth();
       return;
    }

    setShowCheckout(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#22ff88] animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#22ff88] selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-xl bg-[#050505]/60">
        <button onClick={onBack} className="flex items-center gap-2 group text-[#64748b] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
        </button>
        <div className="flex items-center gap-4">
           {!session && (
             <button onClick={onAuth} className="text-[10px] font-black uppercase tracking-widest text-[#64748b] hover:text-white transition-colors">
                Entrar
             </button>
           )}
           <button 
             onClick={handleCTA}
             className="px-6 py-2.5 bg-[#22ff88] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
           >
             {isEnrolled ? 'Acessar Treinamento' : 'Inscreva-se Agora'}
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-8 max-w-7xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-[#22ff88]/10 text-[#22ff88] text-[10px] font-black rounded-lg uppercase tracking-widest border border-[#22ff88]/20">
              Masterclass Oficial
            </span>
            <div className="flex items-center gap-1.5 text-white/40">
              <Star className="w-3.5 h-3.5 text-[#22ff88] fill-[#22ff88]" />
              <span className="text-xs font-bold">{course.rating?.toFixed(1) || '4.9'} • +{course.students_count || '120'} Alunos</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-black leading-[1.1] mb-8 tracking-tighter">
            {course.title}
          </h1>
          <p className="text-lg text-[#94a3b8] leading-relaxed mb-10 max-w-2xl">
            {course.description}
          </p>
          <div className="flex flex-wrap gap-8 py-8 border-y border-white/5 mb-10">
             <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#22ff88]" />
                <div>
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Acesso por</p>
                  <p className="text-sm font-bold text-white">{course.access_duration || 12} Meses</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#22ff88]" />
                <div>
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Garantia de</p>
                  <p className="text-sm font-bold text-white">7 Dias</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-[#22ff88]" />
                <div>
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Certificado</p>
                  <p className="text-sm font-bold text-white">Digital</p>
                </div>
             </div>
          </div>
          <button 
            onClick={course.is_blocked ? undefined : handleCTA}
            disabled={course.is_blocked}
            className={cn(
              "w-full md:w-auto px-12 py-5 font-black rounded-2xl text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3",
              course.is_blocked 
                ? "bg-white/5 text-[#64748b] border border-white/10 cursor-not-allowed shadow-none" 
                : "bg-[#22ff88] text-black hover:opacity-90 shadow-[0_0_50px_rgba(34,255,136,0.2)]"
            )}
          >
            {course.is_blocked ? (
              <>
                <Lock className="w-4 h-4" />
                MATRÍCULAS SUSPENSAS
              </>
            ) : isEnrolled ? 'IR PARA O MEU CONSOLE' : (
               <>
                GARANTIR MINHA VAGA AGORA
                <ChevronRight className="w-4 h-4" />
               </>
            )}
          </button>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1, delay: 0.2 }}
           className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group"
        >
          <img src={course.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
             <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
             </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-10 left-10">
             <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Vídeo de Introdução</p>
             <p className="text-sm font-bold text-white">Assista e veja o que te espera</p>
          </div>
        </motion.div>
      </header>

      {/* Curriculum */}
      <section className="px-8 py-32 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black mb-4">Grade Curricular</h2>
            <p className="text-[#64748b] uppercase tracking-widest text-[10px] font-bold">Conteúdo técnico de ponta a ponta</p>
          </div>

          <div className="space-y-4">
            {modules.map((module, mIdx) => (
              <div key={module.id} className="bg-[#0f1115] border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-8 flex justify-between items-center border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-mono text-white/10">0{mIdx + 1}</span>
                    <h3 className="text-lg font-bold text-white">{module.title}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">{module.lessons?.length || 0} Aulas</span>
                </div>
                <div className="p-4 space-y-2">
                  {module.lessons?.map((lesson: any) => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                         <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-white/10">
                            <Lock className="w-3 h-3 text-white/20" />
                         </div>
                         <p className="text-sm font-medium text-white/60">{lesson.title}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#64748b] uppercase">{lesson.duration || '--:--'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor */}
      <section className="px-8 py-32 max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        <div className="relative aspect-square max-w-md mx-auto rounded-[3rem] overflow-hidden border border-white/5">
          <img 
            src={course.instructor?.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop"} 
            className="w-full h-full object-cover" 
            alt={course.instructor?.full_name}
          />
          <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black to-transparent">
             <p className="text-2xl font-black text-white">{course.instructor?.full_name}</p>
             <p className="text-[10px] font-bold text-[#22ff88] uppercase tracking-[0.2em]">Instructor Expert</p>
          </div>
        </div>
        <div>
           <h2 className="text-4xl font-black mb-8">Aprenda com quem <span className="text-[#22ff88]">domina a prática.</span></h2>
           <p className="text-lg text-[#94a3b8] leading-relaxed mb-10 italic">
             "{course.instructor?.bio || "Nossa missão é transformar conhecimentos técnicos em vantagem competitiva para profissionais que buscam excelência no setor da construção."}"
           </p>
           <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-3xl font-black text-white mb-1">+10k</p>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Projetos Executados</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white mb-1">15+</p>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Anos de Experiência</p>
              </div>
           </div>
        </div>
      </section>

      {/* Floating CTA for Mobile */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-4rem)] max-w-md md:hidden">
         <button 
           onClick={course.is_blocked ? undefined : handleCTA}
           disabled={course.is_blocked}
           className={cn(
             "w-full py-5 font-black rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
             course.is_blocked
               ? "bg-black/60 text-[#64748b] border border-white/10 backdrop-blur-xl"
               : "bg-[#22ff88] text-black shadow-2xl"
           )}
         >
           {course.is_blocked ? (
             <>
               <Lock className="w-3.5 h-3.5" />
               MATRÍCULAS SUSPENSAS
             </>
           ) : (
             <>Garantir Vaga • R$ {course.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
           )}
         </button>
      </div>

      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal
            course={course}
            userId={session?.user?.id}
            onClose={() => setShowCheckout(false)}
            onSuccess={() => {
              setShowCheckout(false);
              setIsEnrolled(true);
              onBack();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
