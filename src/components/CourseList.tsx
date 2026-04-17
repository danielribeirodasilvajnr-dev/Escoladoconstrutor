import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, BookOpen, Users, Star, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Course {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  is_published: boolean;
  students_count: number;
  rating: number;
}

interface CourseListProps {
  userData: any;
  onEditCourse: (courseId: string) => void;
  onCreateCourse: () => void;
}

export function CourseList({ userData, onEditCourse, onCreateCourse }: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [userData.id]);

  async function fetchCourses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar cursos:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-10 max-w-[1600px] mx-auto space-y-10 pb-20">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Meus Cursos</h1>
          <p className="text-[#64748b] text-base">Gerencie seus conteúdos autorais e acompanhe o engajamento.</p>
        </div>
        <button
          onClick={onCreateCourse}
          className="flex items-center gap-2 px-8 py-4 bg-[#22ff88] text-black font-bold rounded-2xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(34,255,136,0.2)] active:scale-95"
        >
          <Plus className="w-5 h-5" />
          CRIAR NOVO CURSO
        </button>
      </header>

      {/* Search and Filters */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b] group-focus-within:text-[#22ff88] transition-colors" />
        <input
          type="text"
          placeholder="Buscar nos meus cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1a1c22] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#1a1c22] aspect-[4/5] rounded-[2.5rem] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-[#1a1c22] rounded-[2.5rem] border border-white/5 p-20 text-center">
          <div className="w-20 h-20 bg-[#22ff88]/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#22ff88]/20">
            <BookOpen className="w-10 h-10 text-[#22ff88]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Nenhum curso encontrado</h2>
          <p className="text-[#64748b] mb-8 max-w-md mx-auto">Comece agora a criar sua primeira Masterclass cinematográfica para o Construtor360.</p>
          <button
            onClick={onCreateCourse}
            className="px-8 py-3.5 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
          >
            Lançar Primeiro Curso
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#1a1c22] rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-[#22ff88]/30 transition-all"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={course.cover_url || 'https://images.unsplash.com/photo-1541829070764-84a7d30dee73?w=800'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={course.title}
                />
                <div className="absolute top-4 right-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    course.is_published ? "bg-[#22ff88] text-black" : "bg-black/60 text-white/60 backdrop-blur-md"
                  )}>
                    {course.is_published ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-white mb-4 line-clamp-1 group-hover:text-[#22ff88] transition-colors">{course.title}</h3>
                <div className="flex items-center justify-between text-[#64748b] mb-8">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold">{course.students_count || 0} ALUNOS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#22ff88]" />
                    <span className="text-xs font-bold text-white">{course.rating || '0.0'}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => onEditCourse(course.id)}
                    className="flex-1 py-4 bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                  <button className="w-14 h-14 bg-white/5 text-[#64748b] rounded-2xl border border-white/10 hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
