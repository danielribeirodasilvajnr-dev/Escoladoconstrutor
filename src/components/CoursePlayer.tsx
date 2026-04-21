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
  Edit3,
  Award,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  content_url: string;
  thumbnail_url: string;
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
  onTakeExam?: (examId: string) => void;
}

export function CoursePlayer({ courseId, onBack, session, onTakeExam }: CoursePlayerProps) {
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [finalExam, setFinalExam] = useState<any>(null);
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

  const [moduleExams, setModuleExams] = useState<any[]>([]);
  const [passedExams, setPassedExams] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  async function fetchCourseData() {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (courseError) throw courseError;
      setCourse(courseData);

      // 2. Fetch modules and lessons
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
            thumbnail_url,
            order_index
          )
        `)
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      const formattedModules = modulesData.map((m: any) => ({
        ...m,
        lessons: m.lessons.sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      setModules(formattedModules);
      
      // 3. Fetch all exams for this course (both module and final)
      const { data: examsData } = await supabase
        .from('exams')
        .select('id, title, is_final, module_id')
        .eq('course_id', courseId);
      
      if (examsData) {
        setFinalExam(examsData.find(e => e.is_final));
        setModuleExams(examsData.filter(e => !e.is_final));

        // 4. Check which exams are already passed
        const examIds = examsData.map(e => e.id);
        if (examIds.length > 0) {
          const { data: subs } = await supabase
            .from('exam_submissions')
            .select('exam_id')
            .eq('user_id', user.id)
            .eq('passed', true)
            .in('exam_id', examIds);
          
          if (subs) {
            setPassedExams(new Set(subs.map(s => s.exam_id)));
          }
        }
      }
      
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

      // Notify Instructor
      if (course?.instructor_id && course.instructor_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: course.instructor_id,
          type: 'comment',
          title: 'Nova dúvida em seu curso',
          message: `${userData?.name || 'Um aluno'} comentou na aula "${currentLesson.title}"`,
          link: `/dashboard?course=${courseId}&lesson=${currentLesson.id}`
        });
      }

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

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: open in new tab if blob fetch fails
      window.open(url, '_blank');
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
        <div className="p-3 md:p-12 max-w-[1200px] mx-auto">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#64748b] hover:text-white transition-colors mb-4 md:mb-8 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Painel</span>
          </button>

          {/* Video Player */}
          <div className="relative aspect-video rounded-xl md:rounded-[2.5rem] bg-black border border-white/5 overflow-hidden shadow-2xl group mb-6 md:mb-10">
            {currentLesson?.content_url ? (
              <video 
                ref={videoRef}
                key={currentLesson.id}
                src={currentLesson.content_url + '#t=0.001'}
                poster={currentLesson.thumbnail_url}
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
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-[#22ff88]/10 text-[#22ff88] text-[8px] md:text-[10px] font-black rounded-lg uppercase tracking-widest border border-[#22ff88]/20">
                Advanced
              </span>
              <div className="flex items-center gap-1 text-white/60">
                <Star className="w-3 h-3 text-[#22ff88] fill-[#22ff88]" />
                <span className="text-[10px] font-bold">{course?.rating ? Number(course.rating).toFixed(1) : '4.8'}</span>
              </div>
            </div>

            <h1 className="text-xl md:text-5xl font-black text-white leading-tight">
              {course?.title}
            </h1>

            <p className="text-[#64748b] text-sm md:text-lg leading-relaxed max-w-3xl line-clamp-2 md:line-clamp-none">
              {course?.description}
            </p>

            {/* Tabs for Engagement */}
            <div className="pt-6 md:pt-10 border-t border-white/5">
              <div className="flex gap-4 md:gap-8 border-b border-white/5 mb-6 md:mb-8 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'about', label: 'Sobre', icon: FileText },
                  { id: 'materials', label: 'Materiais', icon: Download, count: attachments.length },
                  { id: 'comments', label: 'Dúvidas', icon: MessageSquare, count: comments.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 pb-3 md:pb-4 text-[9px] md:text-xs font-bold uppercase tracking-widest transition-all relative shrink-0",
                      activeTab === tab.id ? "text-[#22ff88]" : "text-[#64748b] hover:text-white"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={cn(
                        "ml-1 px-1 py-0.5 rounded-md text-[8px]",
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
                    <div className="bg-[#1a1c22] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5">
                      <h4 className="text-xs md:text-sm font-bold text-white mb-3">O que você vai aprender:</h4>
                      <p className="text-xs md:text-sm">{currentLesson?.content || "Nesta aula, exploramos conceitos avançados com aplicações práticas reais."}</p>
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
                          <button
                            key={att.id}
                            onClick={() => handleDownload(att.file_url, att.title)}
                            className="bg-[#1a1c22] p-4 md:p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-[#22ff88]/30 transition-all text-left w-full"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-[#22ff88]/10 transition-colors">
                                <FileText className="w-5 h-5 text-[#64748b] group-hover:text-[#22ff88] transition-colors" />
                              </div>
                              <div>
                                <p className="font-bold text-xs text-white mb-1 truncate max-w-[150px]">{att.title}</p>
                                <p className="text-[8px] text-[#64748b] uppercase tracking-widest">{att.file_type || 'PDF'} • {formatFileSize(att.file_size)}</p>
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-[#64748b] group-hover:text-[#22ff88] transition-all" />
                          </button>
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
      <div className="w-full lg:w-[400px] bg-[#0f1115] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-[50vh] lg:h-full">
        <div className="p-5 md:p-8 border-b border-white/5">
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h2 className="text-lg md:text-xl font-bold text-white">Conteúdo</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline mb-1">
              <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest">
                {modules.length} Mód • {modules.reduce((acc, m) => acc + m.lessons.length, 0)} Aulas • {(() => {
                  let totalSeconds = 0;
                  modules.forEach(m => {
                    m.lessons?.forEach((l: any) => {
                      const [mins, secs] = (l.duration || '0:00').split(':').map(Number);
                      totalSeconds += (mins || 0) * 60 + (secs || 0);
                    });
                  });
                  const h = Math.floor(totalSeconds / 3600);
                  const m = Math.floor((totalSeconds % 3600) / 60);
                  return `${h > 0 ? `${h}h ` : ''}${m}m`;
                })()}
              </p>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: '45%' }}
                 className="h-full bg-[#22ff88] shadow-[0_0_10px_rgba(34,255,136,0.5)]"
               />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {modules.map((module, mIdx) => {
            const moduleExam = moduleExams.find(e => e.module_id === module.id);
            const isModuleExamPassed = moduleExam && passedExams.has(moduleExam.id);

            return (
              <div key={module.id} className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-[10px] font-black text-[#22ff88] uppercase tracking-[0.2em]">Módulo {mIdx + 1 < 10 ? `0${mIdx + 1}` : mIdx + 1}</span>
                </div>
                
                {module.lessons.map((lesson, lIdx) => {
                  const isActive = currentLesson?.id === lesson.id;
                  const isLocked = mIdx > 0 && lIdx > 0 && false; // Keep it unlocked for now as per previous logic

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isLocked && setCurrentLesson(lesson)}
                      className={`w-full group p-4 md:p-5 rounded-xl md:rounded-2xl border text-left transition-all ${
                        isActive 
                          ? 'bg-[#22ff88]/5 border-[#22ff88]/20' 
                          : 'bg-[#1a1c22] border-white/5 hover:border-white/10'
                      } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isActive ? (
                              <span className="px-1.5 py-0.5 bg-[#22ff88] text-[8px] font-black text-black rounded uppercase tracking-tighter">Live</span>
                            ) : (
                              <span className="text-[8px] md:text-[10px] font-bold text-[#64748b] uppercase">{lIdx + 1 < 10 ? `0${lIdx + 1}` : lIdx + 1}</span>
                            )}
                          </div>
                          <h4 className={`text-xs md:text-sm font-bold transition-colors mb-1.5 ${isActive ? 'text-[#22ff88]' : 'text-white/80 group-hover:text-white'}`}>
                            {lesson.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[#64748b]">
                            <Play className={`w-2.5 h-2.5 ${isActive ? 'text-[#22ff88] fill-[#22ff88]' : ''}`} />
                            <span className="text-[8px] md:text-[10px] font-bold tracking-widest uppercase">{lesson.duration || '--:--'}</span>
                          </div>
                        </div>
                        <div className="mt-1 shrink-0">
                          {isLocked ? (
                            <Lock className="w-3.5 h-3.5 text-[#334155]" />
                          ) : isActive ? (
                            <div className="w-4 h-4 rounded-full border border-[#22ff88] flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#22ff88] animate-pulse" />
                            </div>
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#334155]" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Module Exam Hook */}
                {moduleExam && (
                  <button
                    onClick={() => onTakeExam?.(moduleExam.id)}
                    className={cn(
                      "w-full group p-4 rounded-xl border flex items-center justify-between transition-all",
                      isModuleExamPassed 
                        ? "bg-[#22ff88]/10 border-[#22ff88]/30" 
                        : "bg-white/5 border-dashed border-white/10 hover:border-[#22ff88]/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        isModuleExamPassed ? "bg-[#22ff88]/20" : "bg-white/5"
                      )}>
                        <ShieldCheck className={cn("w-4 h-4", isModuleExamPassed ? "text-[#22ff88]" : "text-[#64748b]")} />
                      </div>
                      <div className="text-left">
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-widest mb-0.5",
                          isModuleExamPassed ? "text-[#22ff88]" : "text-white/60"
                        )}>
                          Avaliação do Módulo
                        </p>
                        <p className={cn(
                          "text-[8px] font-bold uppercase tracking-tight",
                          isModuleExamPassed ? "text-[#22ff88]/60" : "text-[#64748b]"
                        )}>
                          {isModuleExamPassed ? 'Concluído com Sucesso' : 'Clique para Iniciar'}
                        </p>
                      </div>
                    </div>
                    {isModuleExamPassed && (
                      <CheckCircle2 className="w-4 h-4 text-[#22ff88]" />
                    )}
                  </button>
                )}
              </div>
            );
          })}

          {/* Final Exam Card */}
          {finalExam && (() => {
            const isFinalPassed = passedExams.has(finalExam.id);
            return (
              <div className="pt-6">
                <button
                  onClick={() => onTakeExam?.(finalExam.id)}
                  className={cn(
                    "w-full group p-6 rounded-[2rem] transition-all text-left relative overflow-hidden",
                    isFinalPassed 
                      ? "bg-[#22ff88]/10 border border-[#22ff88]/30" 
                      : "bg-[#22ff88]/5 border border-[#22ff88]/20 hover:border-[#22ff88]/50"
                  )}
                >
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#22ff88]/10 blur-[40px] rounded-full" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#22ff88]" />
                        <span className="text-[10px] font-black text-[#22ff88] uppercase tracking-[0.2em]">
                          {isFinalPassed ? 'Certificação Concluída' : 'Certificação Final'}
                        </span>
                      </div>
                      {isFinalPassed && <CheckCircle2 className="w-5 h-5 text-[#22ff88]" />}
                    </div>
                    <h4 className="text-white font-black text-base md:text-lg leading-tight mb-2 group-hover:text-[#22ff88] transition-colors">{finalExam.title}</h4>
                    <p className="text-[#64748b] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {isFinalPassed ? 'Você já conquistou seu certificado!' : 'Basta atingir a nota mínima para emitir seu certificado'}
                    </p>
                  </div>
                </button>
              </div>
            );
          })()}
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
