import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  ChevronRight, 
  Lock, 
  CheckCircle2, 
  Download, 
  Star, 
  ArrowLeft,
  Settings,
  Maximize2,
  Volume2,
  FastForward,
  Rewind,
  Loader2,
  Bell
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  content_url: string;
  order_index: number;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface CoursePlayerProps {
  courseId: string;
  onBack: () => void;
}

export function CoursePlayer({ courseId, onBack }: CoursePlayerProps) {
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lastSavedTime, setLastSavedTime] = useState(0);
  const currentTimeRef = useRef(0);
  const [isInitialSeek, setIsInitialSeek] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  async function fetchCourseData() {
    try {
      setLoading(true);
      
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch modules and lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          order_index,
          lessons (
            id,
            title,
            duration,
            content_url,
            order_index
          )
        `)
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // Sort lessons within modules
      const formattedModules = modulesData.map((m: any) => ({
        ...m,
        lessons: m.lessons.sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      setModules(formattedModules);
      
      // Set first lesson as default
      if (formattedModules.length > 0 && formattedModules[0].lessons.length > 0) {
        setCurrentLesson(formattedModules[0].lessons[0]);
      }

    } catch (error: any) {
      console.error('Erro ao carregar player:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch progress for current lesson
  useEffect(() => {
    if (currentLesson) {
      setIsInitialSeek(true);
      fetchProgress(currentLesson.id);
    }
  }, [currentLesson]);

  // Save progress on unmount or lesson change
  useEffect(() => {
    return () => {
      if (currentTimeRef.current > 0) {
        saveProgress(currentTimeRef.current);
      }
    };
  }, [currentLesson?.id]);

  async function fetchProgress(lessonId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('lesson_progress')
      .select('watched_time')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single();

    if (data && videoRef.current) {
      videoRef.current.currentTime = data.watched_time;
      setLastSavedTime(data.watched_time);
    }
  }

  // Throttled progress saving
  const handleTimeUpdate = async () => {
    if (!videoRef.current || !currentLesson) return;

    const currentTime = Math.floor(videoRef.current.currentTime);
    currentTimeRef.current = currentTime;
    
    // Save every 10 seconds or when close to end
    if (Math.abs(currentTime - lastSavedTime) >= 10 || videoRef.current.ended) {
      setLastSavedTime(currentTime);
      await saveProgress(currentTime);
    }
  };

  async function saveProgress(time: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        course_id: courseId,
        lesson_id: currentLesson?.id,
        watched_time: time,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] space-y-4">
        <Loader2 className="w-12 h-12 text-[#22ff88] animate-spin" />
        <p className="text-[#64748b] font-medium animate-pulse uppercase tracking-widest text-xs">Iniciando Cinema Engineering...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[#0a0b0e]">
      {/* Main Player Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-12 max-w-[1200px] mx-auto">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[#64748b] hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Voltar para o Console</span>
          </button>

          {/* Video Player */}
          <div className="relative aspect-video rounded-[2.5rem] bg-black border border-white/5 overflow-hidden shadow-2xl group mb-10">
            {currentLesson?.content_url ? (
              <video 
                ref={videoRef}
                key={currentLesson.id}
                src={currentLesson.content_url}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-contain"
                controls
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0f1115] to-black">
                <div className="text-center">
                  <Play className="w-20 h-20 text-white/10 mx-auto mb-6" />
                  <p className="text-[#64748b] font-medium uppercase tracking-widest text-xs">Nenhum vídeo disponível para esta aula</p>
                </div>
              </div>
            )}
            
            {/* Custom Overlay (Simulated) */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>

          {/* Course Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-[#22ff88]/10 text-[#22ff88] text-[10px] font-black rounded-lg uppercase tracking-widest border border-[#22ff88]/20">
                Advanced Tier
              </span>
              <div className="flex items-center gap-1.5 text-white/60">
                <Star className="w-3.5 h-3.5 text-[#22ff88] fill-[#22ff88]" />
                <span className="text-xs font-bold">{course?.rating ? Number(course.rating).toFixed(1) : '4.8'} Rating</span>
              </div>
            </div>

            <h1 className="text-5xl font-black text-white leading-tight">
              {course?.title || "Advanced Structural Dynamics for Robotic Systems"}
            </h1>

            <p className="text-[#64748b] text-lg leading-relaxed max-w-3xl">
              {course?.description || "Explore the foundational principles of structural analysis applied to modern robotics. This auteur-series course dives deep into harmonic oscillations, damping coefficients, and real-world implementation of dynamic controls."}
            </p>

            <div className="flex items-center gap-4 pt-4">
              <button className="h-14 px-8 bg-[#22ff88] text-black font-extrabold rounded-2xl flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,255,136,0.2)] text-xs uppercase tracking-widest">
                <Download className="w-4 h-4" />
                Download Materials
              </button>
              <button className="h-14 px-8 bg-white/5 text-white font-extrabold rounded-2xl border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-xs uppercase tracking-widest">
                Share Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Sidebar */}
      <div className="w-[450px] bg-[#0f1115] border-l border-white/5 flex flex-col">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Conteúdo do Curso</h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
                {modules.length} Módulos • {modules.reduce((acc, m) => acc + m.lessons.length, 0)} Aulas totais
              </p>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: '45%' }}
                 className="h-full bg-[#22ff88] shadow-[0_0_10px_rgba(34,255,136,0.5)]"
               />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {modules.map((module, mIdx) => (
            <div key={module.id} className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-[10px] font-black text-[#22ff88] uppercase tracking-[0.2em]">Módulo {mIdx + 1 < 10 ? `0${mIdx + 1}` : mIdx + 1}</span>
              </div>
              
              {module.lessons.map((lesson, lIdx) => {
                const isActive = currentLesson?.id === lesson.id;
                const isLocked = mIdx > 0 && lIdx > 0; // Simulated lock for visual

                return (
                  <button
                    key={lesson.id}
                    onClick={() => !isLocked && setCurrentLesson(lesson)}
                    className={`w-full group p-5 rounded-2xl border text-left transition-all ${
                      isActive 
                        ? 'bg-[#22ff88]/5 border-[#22ff88]/20 shadow-[0_0_20px_rgba(34,255,136,0.05)]' 
                        : 'bg-[#1a1c22] border-white/5 hover:border-white/10'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {isActive ? (
                            <span className="px-2 py-0.5 bg-[#22ff88] text-[9px] font-black text-black rounded uppercase tracking-tighter">Assistindo</span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#64748b] uppercase">Aula {lIdx + 1 < 10 ? `0${lIdx + 1}` : lIdx + 1}</span>
                          )}
                        </div>
                        <h4 className={`text-sm font-bold transition-colors mb-2 ${isActive ? 'text-[#22ff88]' : 'text-white/80 group-hover:text-white'}`}>
                          {lesson.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[#64748b]">
                          <Play className={`w-3 h-3 ${isActive ? 'text-[#22ff88] fill-[#22ff88]' : ''}`} />
                          <span className="text-[10px] font-bold tracking-widest uppercase">{lesson.duration || '45:00'}</span>
                        </div>
                      </div>
                      <div className="mt-1">
                        {isLocked ? (
                          <Lock className="w-4 h-4 text-[#334155]" />
                        ) : isActive ? (
                          <div className="w-5 h-5 rounded-full border-2 border-[#22ff88] flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-[#22ff88] animate-pulse" />
                          </div>
                        ) : (
                          <CheckCircle2 className="w-4.5 h-4.5 text-[#334155]" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-8 mt-auto border-t border-white/5">
          <button className="w-full py-5 bg-white/5 text-white font-extrabold rounded-2xl border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all text-[11px] uppercase tracking-widest group">
            Continuar Assistindo
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
