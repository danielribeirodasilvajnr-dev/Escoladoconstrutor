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
  Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  content_url: string;
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
  const [uploadProgress, setUploadProgress] = useState(0);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const lessonInputRef = useRef<HTMLInputElement>(null);
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
        alert('Curso criado com sucesso! Agora você pode adicionar módulos e aulas.');
        // If we want to stay in editor, we need to refresh with the new ID
        // or just rely on the parent state update if we had a callback
        onBack(); // Go back to list to see the new course
      }
    } catch (error: any) {
      alert('Erro ao salvar curso: ' + error.message);
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
    } catch (error: any) {
      alert('Erro ao subir capa: ' + error.message);
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
    } catch (error: any) {
      alert('Erro ao criar módulo: ' + error.message);
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
    if (!confirm('Deseja realmente excluir este módulo e todas as suas aulas?')) return;
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);
      if (error) throw error;
      setModules(modules.filter(m => m.id !== moduleId));
    } catch (error: any) {
      alert('Erro ao excluir módulo: ' + error.message);
    }
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
    } catch (error: any) {
      alert('Erro ao criar aula: ' + error.message);
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

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Excluir esta aula?')) return;
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
    } catch (error: any) {
      alert('Erro ao excluir aula: ' + error.message);
    }
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

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#22ff88] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-10 max-w-[1600px] mx-auto pb-20">
      <header className="flex justify-between items-start mb-12">
        <div className="flex items-start gap-6">
          <button
            onClick={onBack}
            className="mt-2 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5 text-[#64748b] hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="max-w-xl">
            <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.2em] mb-4">Editor de Masterclass / Professor</p>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              {course.title || 'Nome do Curso'}
            </h1>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="px-8 py-3.5 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
            Pré-visualizar
          </button>
          <button
            onClick={handleSaveCourse}
            disabled={saving}
            className="px-8 py-3.5 bg-[#22ff88] text-black font-bold rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(34,255,136,0.2)] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SALVAR ALTERAÇÕES'}
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
          <div className="space-y-8">
            <div>
              <label className="text-[9px] font-bold text-[#22ff88] uppercase tracking-[0.2em] mb-4 block">Título do Curso</label>
              <div className="bg-[#1a1c22] border border-white/5 rounded-2xl p-6">
                <input
                  type="text"
                  value={course.title}
                  onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-transparent border-none text-3xl font-bold text-white w-full focus:outline-none placeholder:text-white/20"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-[#22ff88] uppercase tracking-[0.2em] mb-4 block">Descrição Técnica</label>
              <textarea
                placeholder="Descreva o conteúdo..."
                value={course.description}
                onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-[#1a1c22] border border-white/5 rounded-2xl p-8 text-white text-lg min-h-[200px] focus:outline-none focus:border-[#22ff88]/30 transition-all resize-none"
              />
            </div>
          </div>

          {/* Curriculum Architecture */}
          <section className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                ARQUITETURA DO <span className="text-[#22ff88]">CURRÍCULO</span>
              </h2>
              <button
                onClick={handleAddModule}
                className="flex items-center gap-2 px-6 py-2.5 bg-white/5 text-[#22ff88] text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors border border-[#22ff88]/10"
              >
                <Plus className="w-4 h-4" />
                NOVO MÓDULO
              </button>
            </div>

            <div className="space-y-6">
              {modules.map((module, mIdx) => (
                <div key={module.id} className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  <div className="xl:col-span-3 bg-[#1a1c22] border-l-4 border-[#22ff88] rounded-3xl overflow-hidden border border-white/5">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-mono text-white/10">{String(mIdx + 1).padStart(2, "0")}</span>
                        <input
                          type="text"
                          defaultValue={module.title}
                          onBlur={(e) => handleUpdateModuleTitle(module.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="bg-transparent border-none text-lg font-bold text-white focus:outline-none focus:text-[#22ff88] transition-colors w-full"
                        />
                      </div>
                      <div className="flex gap-4 text-[#64748b]">
                        <button onClick={() => handleDeleteModule(module.id)} className="hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-8 space-y-4">
                      {module.lessons.map((lesson, lIdx) => (
                        <div key={lesson.id} className="bg-[#0f1115] border border-white/5 rounded-xl p-4 flex items-center justify-between group">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-[#22ff88]/30 transition-colors">
                              {lesson.content_url ? (
                                <video 
                                  src={lesson.content_url} 
                                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                  preload="metadata"
                                />
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
                              className="bg-transparent border-none text-sm font-bold text-white/60 group-hover:text-white focus:outline-none flex-1 focus:text-[#22ff88]"
                            />
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleDeleteLesson(module.id, lesson.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-[#64748b] hover:text-red-400 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            {uploadingLessonId === lesson.id ? (
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#22ff88] transition-all" style={{ width: `${uploadProgress}%` }} />
                                </div>
                                <span className="text-[10px] text-[#22ff88] font-bold">{uploadProgress}%</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setUploadingLessonId(lesson.id);
                                  lessonInputRef.current?.click();
                                }}
                                className="text-[9px] font-bold text-[#64748b] hover:text-[#22ff88] uppercase tracking-widest transition-colors"
                              >
                                {lesson.content_url ? "TROCAR VÍDEO" : "UPLOAD VÍDEO"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddLesson(module.id)}
                        className="flex items-center gap-2 text-[10px] font-bold text-[#64748b] uppercase tracking-widest mt-4 hover:text-[#22ff88] transition-colors pl-4"
                      >
                        + ADICIONAR AULA
                      </button>
                    </div>
                  </div>

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
                </div>
              ))}

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
        <div className="space-y-8">
          <div className="bg-[#1a1c22] p-8 rounded-[2.5rem] border border-white/5">
            <div className="flex items-center gap-3 mb-10">
              <Settings className="w-4 h-4 text-[#22ff88]" />
              <h3 className="text-[10px] font-bold text-[#22ff88] uppercase tracking-[0.2em]">LÓGICA DE CONTROLE</h3>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-4">PREÇO DE INSCRIÇÃO (BRL)</p>
                <div className="relative bg-[#0f1115] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="px-8 py-7 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-[#22ff88]">R$</span>
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
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
