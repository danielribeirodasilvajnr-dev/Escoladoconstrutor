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
  Bell,
  MessageSquare,
  FileText,
  Send,
  Trash2,
  Reply,
  Edit3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  content_url: string;
  order_index: number;
}

interface Attachment {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
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
  session: any;
}

export function CoursePlayer({ courseId, onBack, session }: CoursePlayerProps) {
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'materials' | 'comments'>('about');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
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

  // Fetch progress, attachments and comments for current lesson
  useEffect(() => {
    if (currentLesson) {
      setIsInitialSeek(true);
      fetchProgress(currentLesson.id);
      fetchLessonExtras(currentLesson.id);
    }
  }, [currentLesson]);

  async function fetchLessonExtras(lessonId: string) {
    try {
      // Fetch Attachments
      const { data: atts } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId);
      setAttachments(atts || []);

      // Fetch Comments with User Profile
      const { data: comms } = await supabase
        .from('lesson_comments')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });
      setComments(comms || []);
    } catch (error) {
      console.error('Error fetching lesson extras:', error);
    }
  }

  async function handlePostComment() {
    if (!newComment.trim() || !currentLesson) return;

    try {
      setIsSubmittingComment(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('lesson_comments')
        .insert({
          lesson_id: currentLesson.id,
          user_id: user.id,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setComments(prev => [data, ...prev]);
      setNewComment('');
      toast.success('Comentário enviado!');
    } catch (error: any) {
      toast.error('Erro ao enviar comentário: ' + error.message);
    } finally {
      setIsSubmittingComment(false);
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comentário removido');
    } catch (error: any) {
      toast.error('Erro ao remover: ' + error.message);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingContent.trim()) return;

    try {
      const { error } = await supabase
        .from('lesson_comments')
        .update({ content: editingContent.trim() })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, content: editingContent.trim() } : c
      ));
      setEditingCommentId(null);
      toast.success('Comentário atualizado!');
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
      .maybeSingle();

    if (data && videoRef.current) {
      videoRef.current.currentTime = data.watched_time;
      setLastSavedTime(data.watched_time);
    }
  }

  const handleLoadedMetadata = async () => {
    if (!videoRef.current || !currentLesson) return;
    
    // If duration is missing or just a placeholder, "heal" it by saving the real metadata to DB
    if (!currentLesson.duration || currentLesson.duration === '--:--' || currentLesson.duration === '45:00') {
      const minutes = Math.floor(videoRef.current.duration / 60);
      const seconds = Math.floor(videoRef.current.duration % 60);
      const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      try {
        // Update Supabase
        await supabase
          .from('lessons')
          .update({ duration: durationStr })
          .eq('id', currentLesson.id);
          
        // Update local state for immediate UI feedback
        setModules(prev => prev.map(m => ({
          ...m,
          lessons: m.lessons.map(l => l.id === currentLesson.id ? { ...l, duration: durationStr } : l)
        })));

        // Also update currentLesson duration so the condition doesn't trigger again
        setCurrentLesson(prev => prev ? { ...prev, duration: durationStr } : null);
        toast.success(`Duração da aula sincronizada: ${durationStr}`);
      } catch (error) {
        console.error('Erro ao atualizar duração auto-healing:', error);
      }
    }
  };

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
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-80px)] overflow-hidden bg-[#0a0b0e]">
      {/* Main Player Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 md:p-12 max-w-[1200px] mx-auto">
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
                onLoadedMetadata={handleLoadedMetadata}
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

            <h1 className="text-2xl md:text-5xl font-black text-white leading-tight">
              {course?.title || "Advanced Structural Dynamics for Robotic Systems"}
            </h1>

            <p className="text-[#64748b] text-base md:text-lg leading-relaxed max-w-3xl">
              {course?.description || "Explore the foundational principles of structural analysis applied to modern robotics. This auteur-series course dives deep into harmonic oscillations, damping coefficients, and real-world implementation of dynamic controls."}
            </p>

            {/* Tabs for Engagement */}
            <div className="pt-10 border-t border-white/5">
              <div className="flex gap-4 md:gap-8 border-b border-white/5 mb-8 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'about', label: 'Sobre', icon: FileText },
                  { id: 'materials', label: 'Materiais', icon: Download, count: attachments.length },
                  { id: 'comments', label: 'Dúvidas', icon: MessageSquare, count: comments.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                      activeTab === tab.id ? "text-[#22ff88]" : "text-[#64748b] hover:text-white"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={cn(
                        "ml-1 px-1.5 py-0.5 rounded-md text-[9px]",
                        activeTab === tab.id ? "bg-[#22ff88]/20 text-[#22ff88]" : "bg-white/5 text-[#64748b]"
                      )}>
                        {tab.count}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22ff88]" 
                      />
                    )}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'about' && (
                  <motion.div
                    key="about"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[#94a3b8] text-sm leading-relaxed"
                  >
                    <div className="bg-[#1a1c22] p-8 rounded-3xl border border-white/5">
                      <h4 className="text-white font-bold mb-4">O que você vai aprender:</h4>
                      <p>{currentLesson?.content || "Nesta aula, exploramos conceitos avançados com aplicações práticas reais. Focamos na resolução de problemas complexos e na implementação de fluxos de trabalho eficientes."}</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'materials' && (
                  <motion.div
                    key="materials"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {attachments.length === 0 ? (
                      <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <Download className="w-12 h-12 text-[#64748b] mx-auto mb-4 opacity-20" />
                        <p className="text-[#64748b] text-sm">Nenhum material de apoio disponível para esta aula.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#1a1c22] p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-[#22ff88]/30 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-[#22ff88]/10 transition-colors">
                                <FileText className="w-6 h-6 text-[#64748b] group-hover:text-[#22ff88] transition-colors" />
                              </div>
                              <div>
                                <p className="font-bold text-white mb-1">{att.title}</p>
                                <p className="text-[10px] text-[#64748b] uppercase tracking-widest">{att.file_type || 'Arquivo'} • {formatFileSize(att.file_size)}</p>
                              </div>
                            </div>
                            <Download className="w-5 h-5 text-[#64748b] group-hover:text-[#22ff88] transition-all" />
                          </a>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'comments' && (
                  <motion.div
                    key="comments"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {/* Input Area */}
                    <div className="bg-[#1a1c22] p-6 md:p-8 rounded-3xl border border-white/5 gap-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#22ff88]/10 flex items-center justify-center shrink-0">
                           <MessageSquare className="w-5 h-5 text-[#22ff88]" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Tire sua dúvida..."
                            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all min-h-[100px] resize-none"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={handlePostComment}
                              disabled={isSubmittingComment || !newComment.trim()}
                              className="w-full md:w-auto px-8 py-3 bg-[#22ff88] text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                              {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              Enviar Pergunta
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-6">
                      {comments.length === 0 ? (
                        <p className="text-center py-10 text-[#64748b] text-sm italic">Seja o primeiro a comentar nesta aula!</p>
                      ) : (
                        comments.map((comment) => {
                          const isAuthor = comment.user_id === session?.user?.id;
                          const isEditing = editingCommentId === comment.id;

                          return (
                            <div key={comment.id} className="flex gap-4 group">
                               <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                                {comment.profiles?.avatar_url ? (
                                  <img src={comment.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <span className="text-xs font-bold text-[#64748b]">{(comment.profiles?.full_name || '?').charAt(0)}</span>
                                )}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white">{comment.profiles?.full_name || 'Estudante'}</span>
                                    {isAuthor && (
                                      <span className="px-1.5 py-0.5 bg-[#22ff88]/10 text-[#22ff88] text-[8px] font-black rounded uppercase tracking-tighter border border-[#22ff88]/20">Você</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-[#64748b] font-medium">{new Date(comment.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                                
                                {isEditing ? (
                                  <div className="space-y-3">
                                    <textarea
                                      value={editingContent}
                                      onChange={(e) => setEditingContent(e.target.value)}
                                      className="w-full bg-black/40 border border-[#22ff88]/30 rounded-2xl p-4 text-sm text-white focus:outline-none min-h-[80px] resize-none"
                                      autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button 
                                        onClick={() => setEditingCommentId(null)}
                                        className="px-4 py-2 text-[10px] font-bold text-[#64748b] uppercase tracking-widest hover:text-white transition-colors"
                                      >
                                        Cancelar
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateComment(comment.id)}
                                        className="px-4 py-2 bg-[#22ff88] text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all"
                                      >
                                        Salvar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm text-[#94a3b8] leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/5">{comment.content}</p>
                                    <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest hover:text-[#22ff88] flex items-center gap-1 transition-colors">
                                        <Reply className="w-3 h-3" /> Responder
                                      </button>
                                      
                                      {isAuthor && (
                                        <>
                                          <button 
                                            onClick={() => {
                                              setEditingCommentId(comment.id);
                                              setEditingContent(comment.content);
                                            }}
                                            className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest hover:text-white flex items-center gap-1 transition-colors"
                                          >
                                            <Edit3 className="w-3 h-3" /> Editar
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest hover:text-red-400 flex items-center gap-1 transition-colors"
                                          >
                                            <Trash2 className="w-3 h-3" /> Excluir
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Sidebar */}
      <div className="w-full lg:w-[450px] bg-[#0f1115] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-[50vh] lg:h-full">
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
                          <span className="text-[10px] font-bold tracking-widest uppercase">{lesson.duration || '--:--'}</span>
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
