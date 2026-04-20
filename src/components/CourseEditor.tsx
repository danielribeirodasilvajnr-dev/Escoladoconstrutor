import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Play,
  FileText,
  Settings,
  CheckCircle2,
  Trash2,
  Edit3,
  Globe,
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  X,
  Upload,
  ClipboardCheck,
  Award,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { toast } from 'sonner';
import { ConfirmModal } from './ConfirmModal';
import { cn } from '../lib/utils';
import { GripVertical } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  content_url: string;
  thumbnail_url: string;
  duration: string;
  order_index: number;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  price: number;
  is_published: boolean;
  students_count: number;
  rating: number;
}

interface CourseEditorProps {
  courseId: string | null;
  userData: any;
  onBack: () => void;
  onViewChange: (view: string) => void;
  onOpenExam?: (courseId: string, moduleId: string | null) => void;
}

export function CourseEditor({ courseId, userData, onBack, onViewChange, onOpenExam }: CourseEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    price: 0,
    cover_url: '',
    is_published: false,
    students_count: 0,
    rating: 0
  });
  const [priceInput, setPriceInput] = useState('0,00');
  const [modules, setModules] = useState<Module[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [uploadingThumbnailLessonId, setUploadingThumbnailLessonId] = useState<string | null>(null);
  const [uploadingAttachmentLessonId, setUploadingAttachmentLessonId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lessonAttachments, setLessonAttachments] = useState<Record<string, any[]>>({});

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    variant: 'info'
  });

  const coverInputRef = useRef<HTMLInputElement>(null);
  const lessonInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const activeModuleForLesson = useRef<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    } else {
      setLoading(false);
    }
  }, [courseId]);

  async function fetchCourseData() {
    try {
      setLoading(true);
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          *,
          lessons (*)
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (modulesError) throw modulesError;

      // Sort lessons by order_index
      const formattedModules = (modulesData || []).map(m => ({
        ...m,
        lessons: (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      setModules(formattedModules);

      // Update price input string
      if (courseData.price !== undefined) {
        setPriceInput(courseData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      }

      // Fetch all attachments for these modules
      const lessonIds = formattedModules.flatMap(m => m.lessons.map(l => l.id));
      if (lessonIds.length > 0) {
        const { data: atts } = await supabase
          .from('lesson_attachments')
          .select('*')
          .in('lesson_id', lessonIds);
        
        const attMap: Record<string, any[]> = {};
        atts?.forEach(a => {
          if (!attMap[a.lesson_id]) attMap[a.lesson_id] = [];
          attMap[a.lesson_id].push(a);
        });
        setLessonAttachments(attMap);
      }
    } catch (error: any) {
      console.error('Erro ao carregar curso:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCourse() {
    try {
      setSaving(true);
      if (courseId) {
        const { error } = await supabase
          .from('courses')
          .update({
            title: course.title,
            description: course.description,
            price: course.price,
            cover_url: course.cover_url,
            is_published: course.is_published,
            updated_at: new Date().toISOString()
          })
          .eq('id', courseId);
        if (error) throw error;
        toast.success('Curso atualizado com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert({
            title: course.title || 'Novo Curso',
            description: course.description,
            price: course.price,
            cover_url: course.cover_url,
            instructor_id: userData.id
          })
          .select()
          .single();
        if (error) throw error;

        // Update local state with new ID to allow adding modules
        setCourse(data);
        toast.success('Curso criado com sucesso!');
        onBack(); // Go back to list to see the new course
      }
    } catch (error: any) {
      toast.error('Erro ao salvar curso: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const handlePriceChange = (value: string) => {
    // Remove non-numeric chars except comma
    const cleanValue = value.replace(/[^\d,]/g, '');
    setPriceInput(cleanValue);

    // Convert to number for DB (replace comma with dot)
    const numericValue = parseFloat(cleanValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      setCourse(prev => ({ ...prev, price: numericValue }));
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId || 'temp'}-${Math.random()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-content')
        .getPublicUrl(filePath);

      setCourse(prev => ({ ...prev, cover_url: publicUrl }));
      toast.success('Capa do curso atualizada!');
    } catch (error: any) {
      toast.error('Erro ao subir capa: ' + error.message);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAddModule = async () => {
    if (!courseId) return;
    try {
      const newIndex = modules.length;
      const { data, error } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: 'Novo Módulo',
          order_index: newIndex
        })
        .select()
        .single();
      if (error) throw error;
      setModules([...modules, { ...data, lessons: [] }]);
      toast.success('Módulo adicionado!');
    } catch (error: any) {
      toast.error('Erro ao criar módulo: ' + error.message);
    }
  };

  const handleUpdateModuleTitle = async (moduleId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('modules')
        .update({ title })
        .eq('id', moduleId);
      if (error) throw error;
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, title } : m));
    } catch (error: any) {
      console.error('Erro ao atualizar título do módulo:', error.message);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Módulo?',
      message: 'Isso removerá permanentemente o módulo e todas as aulas dentro dele.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('modules')
            .delete()
            .eq('id', moduleId);
          if (error) throw error;
          setModules(modules.filter(m => m.id !== moduleId));
          toast.success('Módulo excluído');
        } catch (error: any) {
          toast.error('Erro ao excluir módulo: ' + error.message);
        }
      }
    });
  };

  const handleAddLesson = async (moduleId: string) => {
    try {
      const moduleIndex = modules.findIndex(m => m.id === moduleId);
      const newIndex = modules[moduleIndex].lessons.length;
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          module_id: moduleId,
          title: 'Nova Aula',
          order_index: newIndex,
          content_type: 'video'
        })
        .select()
        .single();
      if (error) throw error;

      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons.push(data);
      setModules(updatedModules);
      toast.success('Aula adicionada!');
    } catch (error: any) {
      toast.error('Erro ao criar aula: ' + error.message);
    }
  };

  const handleUpdateLessonTitle = async (lessonId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ title })
        .eq('id', lessonId);
      if (error) throw error;
      setModules(prev => prev.map(m => ({
        ...m,
        lessons: m.lessons.map(l => l.id === lessonId ? { ...l, title } : l)
      })));
    } catch (error: any) {
      console.error('Erro ao atualizar título da aula:', error.message);
    }
  };

  const handleReorderModules = async (newModules: Module[]) => {
    // Update local state immediately for smooth UI
    setModules(newModules);

    try {
      // Prepare batch updates for order_index
      const updates = newModules.map((m, index) => ({
        id: m.id,
        order_index: index,
        course_id: courseId // Required by Supabase PK or constraints sometimes, but usually just id is enough
      }));

      // Update in DB (we can do this in the background)
      for (const update of updates) {
        await supabase
          .from('modules')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }
    } catch (error: any) {
      console.error('Erro ao salvar ordem dos módulos:', error.message);
    }
  };

  const handleReorderLessons = async (moduleId: string, newLessons: Lesson[]) => {
    // Update local state immediately
    const updatedModules = modules.map(m => 
      m.id === moduleId ? { ...m, lessons: newLessons } : m
    );
    setModules(updatedModules);

    try {
      // Prepare batch updates
      const updates = newLessons.map((l, index) => ({
        id: l.id,
        order_index: index
      }));

      // Update in DB
      for (const update of updates) {
        await supabase
          .from('lessons')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }
    } catch (error: any) {
      console.error('Erro ao salvar ordem das aulas:', error.message);
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Aula?',
      message: 'Tem certeza que deseja remover esta aula do currículo? Esta ação não pode ser desfeita.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', lessonId);
          if (error) throw error;

          const updatedModules = modules.map(m => {
            if (m.id === moduleId) {
              return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
            }
            return m;
          });
          setModules(updatedModules);
          toast.success('Aula excluída');
        } catch (error: any) {
          toast.error('Erro ao excluir aula: ' + error.message);
        }
      }
    });
  };

  const getFileDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const minutes = Math.floor(video.duration / 60);
        const seconds = Math.floor(video.duration % 60);
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleLessonFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const lessonId = uploadingLessonId;
    if (!file || !lessonId) return;

    try {
      setUploadProgress(5);
      const duration = await getFileDuration(file);
      setUploadProgress(10);

      const fileExt = file.name.split('.').pop();
      const fileName = `${lessonId}-${Math.random()}.${fileExt}`;
      const filePath = `lessons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setUploadProgress(90);

      const { data: { publicUrl } } = supabase.storage
        .from('course-content')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('lessons')
        .update({
          content_url: publicUrl,
          duration: duration
        })
        .eq('id', lessonId);

      if (updateError) throw updateError;

      // Update local state
      const updatedModules = modules.map(m => ({
        ...m,
        lessons: m.lessons.map(l => l.id === lessonId ? { ...l, content_url: publicUrl, duration } : l)
      }));
      setModules(updatedModules);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadingLessonId(null);
        setUploadProgress(0);
      }, 1000);
    } catch (error: any) {
      alert('Erro no upload: ' + error.message);
      setUploadingLessonId(null);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const lessonId = uploadingThumbnailLessonId;
    if (!file || !lessonId) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${lessonId}-thumb-${Math.random()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-content')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('lessons')
        .update({ thumbnail_url: publicUrl })
        .eq('id', lessonId);

      if (updateError) throw updateError;

      // Update local state
      const updatedModules = modules.map(m => ({
        ...m,
        lessons: m.lessons.map(l => l.id === lessonId ? { ...l, thumbnail_url: publicUrl } : l)
      }));
      setModules(updatedModules);
      toast.success('Capa da aula atualizada!');
    } catch (error: any) {
      toast.error('Erro ao subir capa: ' + error.message);
    } finally {
      setUploadingThumbnailLessonId(null);
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>, lessonId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAttachmentLessonId(lessonId);
      const fileExt = file.name.split('.').pop();
      const fileName = `${lessonId}-${Math.random()}.${fileExt}`;
      const filePath = `${lessonId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      const { data, error: dbError } = await supabase
        .from('lesson_attachments')
        .insert({
          lesson_id: lessonId,
          title: file.name,
          file_url: publicUrl,
          file_type: fileExt,
          file_size: file.size
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setLessonAttachments(prev => ({
        ...prev,
        [lessonId]: [...(prev[lessonId] || []), data]
      }));
      toast.success('Material de apoio adicionado!');
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploadingAttachmentLessonId(null);
    }
  };

  const handleDeleteAttachment = async (lessonId: string, attachmentId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_attachments')
        .delete()
        .eq('id', attachmentId);
      
      if (error) throw error;

      setLessonAttachments(prev => ({
        ...prev,
        [lessonId]: prev[lessonId].filter(a => a.id !== attachmentId)
      }));
      toast.success('Anexo removido');
    } catch (error: any) {
      toast.error('Erro ao remover anexo');
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#22ff88] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-10 max-w-[1600px] mx-auto space-y-8 md:space-y-10 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-start gap-4 md:gap-8 mb-8 md:mb-12">
        <div className="flex items-start gap-3 md:gap-6 w-full">
          <button
            onClick={onBack}
            className="mt-1 md:mt-2 p-2.5 md:p-3 bg-white/5 rounded-xl md:rounded-2xl hover:bg-white/10 transition-colors border border-white/5 text-[#64748b] hover:text-white shrink-0"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[8px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-[0.2em] mb-2 md:mb-4">Editor Masterclass</p>
            <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-2 md:mb-6 leading-tight truncate">
              {course.title || 'Novo Curso'}
            </h1>
          </div>
        </div>
        <div className="flex gap-2 md:gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 md:px-8 py-2.5 md:py-3.5 bg-white/5 text-white text-xs md:text-sm font-bold rounded-lg md:rounded-xl hover:bg-white/10 transition-all border border-white/10">
            Preview
          </button>
          <button
            onClick={handleSaveCourse}
            disabled={saving}
            className="flex-1 md:flex-none px-4 md:px-8 py-2.5 md:py-3.5 bg-[#22ff88] text-black text-xs md:text-sm font-bold rounded-lg md:rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(34,255,136,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SALVAR'}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-12">
        <div className="space-y-12">
          {/* Cover Upload */}
          <div
            onClick={() => coverInputRef.current?.click()}
            className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#1a1c22] group cursor-pointer"
          >
            <img
              src={course.cover_url || "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1600&h=900&auto=format&fit=crop"}
              className={cn("w-full h-full object-cover transition-opacity", course.cover_url ? "opacity-60" : "opacity-30 group-hover:opacity-40")}
              alt="Course Cover"
            />
            {uploadingCover && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-md group-hover:scale-110 transition-transform">
                <ImageIcon className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">Trocar Capa Cinematográfica</h3>
                <p className="text-[#64748b] text-xs">Recomendado: 1920x1080px</p>
              </div>
            </div>
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverUpload} />
          </div>

          {/* Title and Description */}
          <div className="space-y-6 md:space-y-8">
            <div>
              <label className="text-[8px] md:text-[9px] font-bold text-[#22ff88] uppercase tracking-[0.2em] mb-2 md:mb-4 block">Título do Curso</label>
              <div className="bg-[#1a1c22] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
                <input
                  type="text"
                  value={course.title}
                  placeholder="Ex: Masterclass de Engenharia"
                  onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-transparent border-none text-xl md:text-3xl font-bold text-white w-full focus:outline-none placeholder:text-white/10"
                />
              </div>
            </div>

            <div>
              <label className="text-[8px] md:text-[9px] font-bold text-[#22ff88] uppercase tracking-[0.2em] mb-2 md:mb-4 block">Descrição do Curso</label>
              <textarea
                placeholder="Descreva o que o aluno irá aprender..."
                value={course.description}
                onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-[#1a1c22] border border-white/5 rounded-xl md:rounded-2xl p-5 md:p-8 text-sm md:text-lg min-h-[150px] md:min-h-[200px] focus:outline-none focus:border-[#22ff88]/30 transition-all resize-none text-white/80"
              />
            </div>
          </div>

          {/* Curriculum Architecture */}
          <section className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                ARQUITETURA DO <span className="text-[#22ff88]">CURRÍCULO</span>
              </h2>
              <button
                onClick={handleAddModule}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white/5 text-[#22ff88] text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors border border-[#22ff88]/10"
              >
                <Plus className="w-4 h-4" />
                NOVO MÓDULO
              </button>
            </div>

            <Reorder.Group 
              axis="y" 
              values={modules} 
              onReorder={handleReorderModules} 
              className="space-y-6"
            >
              {modules.map((module, mIdx) => (
                <Reorder.Item 
                  key={module.id} 
                  value={module}
                  className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6"
                >
                  <div className="xl:col-span-3 bg-[#1a1c22] border-l-4 border-[#22ff88] rounded-2xl md:rounded-3xl overflow-hidden border border-white/5">
                    <div className="p-4 md:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                      <div className="flex items-center gap-3 md:gap-4 flex-1">
                        <GripVertical className="w-5 h-5 text-white/10 cursor-grab active:cursor-grabbing hover:text-[#22ff88]/40 transition-colors" />
                        <span className="text-xl md:text-2xl font-mono text-white/10">{String(mIdx + 1).padStart(2, "0")}</span>
                        <input
                          type="text"
                          defaultValue={module.title}
                          onBlur={(e) => handleUpdateModuleTitle(module.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="bg-transparent border-none text-base md:text-lg font-bold text-white focus:outline-none focus:text-[#22ff88] transition-colors w-full"
                        />
                      </div>
                      <div className="flex gap-2 md:gap-4 text-[#64748b] ml-4">
                        <button onClick={() => handleDeleteModule(module.id)} className="hover:text-red-400 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <Reorder.Group 
                      axis="y" 
                      values={module.lessons} 
                      onReorder={(newLessons) => handleReorderLessons(module.id, newLessons)}
                      className="p-4 md:p-8 space-y-3 md:space-y-4"
                    >
                      {module.lessons.map((lesson, lIdx) => (
                        <Reorder.Item 
                          key={lesson.id} 
                          value={lesson}
                          className="space-y-2"
                        >
                          <div className="bg-[#0f1115] border border-white/5 rounded-xl p-3 md:p-4 flex items-center justify-between group cursor-grab active:cursor-grabbing">
                            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                              <GripVertical className="w-4 h-4 text-white/5 group-hover:text-[#22ff88]/30 transition-colors shrink-0" />
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-[#22ff88]/30 transition-colors relative">
                                {lesson.thumbnail_url ? (
                                  <img 
                                    src={lesson.thumbnail_url} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    alt="Thumbnail"
                                  />
                                ) : lesson.content_url ? (
                                  <>
                                    <video
                                      src={lesson.content_url + '#t=0.001'}
                                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                      preload="metadata"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <Play className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" />
                                    </div>
                                  </>
                                ) : (
                                  <Upload className="w-4 h-4 text-white/20" />
                                )}
                              </div>
                              <input
                                type="text"
                                defaultValue={lesson.title}
                                onBlur={(e) => handleUpdateLessonTitle(lesson.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className="bg-transparent border-none text-[13px] md:text-sm font-bold text-white/60 group-hover:text-white focus:outline-none flex-1 focus:text-[#22ff88] truncate"
                              />
                            </div>
                            <div className="flex items-center gap-2 md:gap-4 shrink-0 h-full">
                              <button
                                onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-[#64748b] hover:text-red-400 transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="flex items-center gap-2 md:gap-3">
                                {uploadingLessonId === lesson.id ? (
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <div className="w-16 md:w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#22ff88] transition-all" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                    <span className="text-[9px] md:text-[10px] text-[#22ff88] font-bold">{uploadProgress}%</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <button
                                      onClick={() => {
                                        setUploadingThumbnailLessonId(lesson.id);
                                        thumbnailInputRef.current?.click();
                                      }}
                                      className="text-[8px] md:text-[9px] font-bold text-[#64748b] hover:text-[#22ff88] uppercase tracking-widest transition-colors flex items-center gap-1"
                                    >
                                      {uploadingThumbnailLessonId === lesson.id ? (
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                      ) : (
                                        <ImageIcon className="w-2.5 h-2.5" />
                                      )}
                                      CAPA
                                    </button>
                                    <div className="w-[1px] h-3 bg-white/5" />
                                    <button
                                      onClick={() => {
                                        setUploadingLessonId(lesson.id);
                                        lessonInputRef.current?.click();
                                      }}
                                      className="text-[8px] md:text-[9px] font-bold text-[#64748b] hover:text-[#22ff88] uppercase tracking-widest transition-colors"
                                    >
                                      {lesson.content_url ? "TROCAR" : "VÍDEO"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Attachments Section */}
                          <div className="ml-16 mt-2 space-y-2">
                             {lessonAttachments[lesson.id]?.map((att) => (
                               <div key={att.id} className="flex items-center justify-between py-2 px-4 bg-white/[0.03] rounded-lg border border-white/5">
                                 <div className="flex items-center gap-2">
                                   <FileText className="w-3 h-3 text-[#64748b]" />
                                   <span className="text-[10px] text-white/50">{att.title}</span>
                                 </div>
                                 <button 
                                   onClick={() => handleDeleteAttachment(lesson.id, att.id)}
                                   className="text-[#64748b] hover:text-red-400 transition-colors"
                                 >
                                   <X className="w-3 h-3" />
                                 </button>
                               </div>
                             ))}
                             <div className="flex items-center gap-4">
                               <label className="cursor-pointer group">
                                 <input 
                                   type="file" 
                                   className="hidden" 
                                   onChange={(e) => handleAttachmentUpload(e, lesson.id)}
                                   disabled={uploadingAttachmentLessonId === lesson.id}
                                 />
                                 <span className="text-[9px] font-bold text-[#22ff88]/60 group-hover:text-[#22ff88] uppercase tracking-widest flex items-center gap-2 transition-all">
                                   {uploadingAttachmentLessonId === lesson.id ? (
                                     <Loader2 className="w-3 h-3 animate-spin" />
                                   ) : (
                                     <Plus className="w-3 h-3" />
                                   )}
                                   Anexar Material (PDF, DWG, EXCEL...)
                                 </span>
                               </label>
                             </div>
                          </div>
                        </Reorder.Item>
                      ))}
                      <button
                        onClick={() => handleAddLesson(module.id)}
                        className="flex items-center gap-2 text-[10px] font-bold text-[#64748b] uppercase tracking-widest mt-4 hover:text-[#22ff88] transition-colors pl-4"
                      >
                        + ADICIONAR AULA
                      </button>
                    </Reorder.Group>
                  </div>

                  <input type="file" ref={thumbnailInputRef} className="hidden" accept="image/*" onChange={handleThumbnailUpload} />

                  {/* Module Exam Square */}
                  <div
                    onClick={() => onOpenExam?.(course.id, module.id)}
                    className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-[#22ff88]/50 transition-all cursor-pointer h-full min-h-[200px]"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#22ff88]/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#22ff88]/10 transition-all">
                      <ClipboardCheck className="w-8 h-8 text-[#22ff88]" />
                    </div>
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-2">PROVA DO MÓDULO</h3>
                    <p className="text-[9px] text-[#64748b] font-bold uppercase tracking-wider mb-6 leading-relaxed">
                      Avaliação obrigatória para conclusão do módulo
                    </p>
                    <button className="px-6 py-2.5 bg-[#22ff88]/10 text-[#22ff88] text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#22ff88] hover:text-black transition-all">
                      GERENCIAR
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

              {/* Final Exam Square */}
              <div
                onClick={() => onOpenExam?.(course.id || '', null)}
                className="mt-12 bg-[#ffcc00]/5 border border-dashed border-[#ffcc00]/20 rounded-[2.5rem] p-10 flex flex-col lg:flex-row items-center justify-between group hover:border-[#ffcc00]/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#ffcc00]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8 text-[#ffcc00]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-1">PROVA FINAL DO CURSO</h3>
                    <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Habilita a emissão automática do certificado</p>
                  </div>
                </div>
                <button className="mt-6 lg:mt-0 px-8 py-3 bg-[#ffcc00]/10 text-[#ffcc00] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#ffcc00] hover:text-black transition-all border border-[#ffcc00]/10">
                  CONFIGURAR EXAME FINAL
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6 md:space-y-8">
          <div className="bg-[#1a1c22] p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/5">
            <div className="flex items-center gap-3 mb-6 md:mb-10">
              <Settings className="w-4 h-4 text-[#22ff88]" />
              <h3 className="text-[9px] md:text-[10px] font-bold text-[#22ff88] uppercase tracking-[0.2em]">CONFIGURAÇÕES</h3>
            </div>

            <div className="space-y-6 md:space-y-8">
              <div>
                <p className="text-[9px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-3 md:mb-4 px-1">VALOR DA INSCRIÇÃO (BRL)</p>
                <div className="relative bg-[#0f1115] border border-white/5 rounded-xl md:rounded-2xl overflow-hidden">
                  <div className="px-6 md:px-8 py-5 md:py-7 flex items-baseline gap-2">
                    <span className="text-lg md:text-xl font-bold text-[#22ff88]">R$</span>
                    <input
                      type="text"
                      value={priceInput}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      onBlur={() => {
                        const val = parseFloat(priceInput.replace(',', '.'));
                        if (!isNaN(val)) {
                          setPriceInput(val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                        }
                      }}
                      className="bg-transparent border-none text-4xl font-bold text-white w-full focus:outline-none placeholder:text-white/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#0f1115] p-5 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">{course.is_published ? 'PUBLICADO' : 'OCULTO'}</span>
                </div>
                <div
                  onClick={() => setCourse(prev => ({ ...prev, is_published: !prev.is_published }))}
                  className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                    course.is_published ? "bg-[#22ff88]" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-black rounded-full transition-all",
                    course.is_published ? "right-1" : "left-1"
                  )} />
                </div>
              </div>
            </div>
          </div>

          {/* Instructor Stats */}
          <div className="bg-[#1a1c22] p-10 rounded-[2.5rem] border border-white/5 text-center">
            <Globe className="w-4 h-4 text-[#22ff88] mx-auto mb-6" />
            <h4 className="text-2xl font-bold text-white mb-2">{userData?.name}</h4>
            <p className="text-xs text-[#64748b] mb-10 uppercase tracking-widest font-bold">Autor da Masterclass</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0f1115] p-5 rounded-2xl border border-white/5">
                <p className="text-2xl font-bold text-white mb-1">{course.students_count || 0}</p>
                <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest">ALUNOS</p>
              </div>
              <div className="bg-[#0f1115] p-5 rounded-2xl border border-white/5">
                <p className="text-2xl font-bold text-[#22ff88] mb-1">{course.rating ? Number(course.rating).toFixed(1) : '5.0'}</p>
                <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest">AVALIAÇÃO</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <input type="file" ref={lessonInputRef} className="hidden" accept="video/*" onChange={handleLessonFileUpload} />

      <ConfirmModal
        {...confirmConfig}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}


