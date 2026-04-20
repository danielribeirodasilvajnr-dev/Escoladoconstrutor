import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HeroSection } from './HeroSection';
import { CourseCard } from './CourseCard';
import { FeaturedCard } from './FeaturedCard';
import { WeeklyCard } from './WeeklyCard';
import { supabase } from '../lib/supabase';
import { BookOpen, Loader2 } from 'lucide-react';

interface DashboardOverviewProps {
  userData: any;
  onCourseSelect: (courseId: string) => void;
}

const recommended = [
  { image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=800&auto=format&fit=crop", category: "Novo Masterclass", title: "Inteligência Artificial em Sistemas Embarcados" },
  { image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=800&auto=format&fit=crop", category: "Fundamentos", title: "Termodinâmica para Energias Renováveis" },
  { image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=800&auto=format&fit=crop", category: "Avançado", title: "Soberania de Dados & Criptografia Industrial" }
];

const weekly = [
  { image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=450&auto=format&fit=crop", type: "Workshop", title: "Otimização de Turbinas Eólicas em Altas Altitudes" },
  { image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&h=450&auto=format&fit=crop", type: "Entrevista", title: "Mobilidade Urbana: O Futuro dos Trens Maglev" },
  { image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=450&auto=format&fit=crop", type: "Documentário", title: "Bastidores: A Engenharia por trás da PrecisionX" },
  { image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&auto=format&fit=crop", type: "Live", title: "Telecomunicações via Starlink & Além" }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function DashboardOverview({ userData, onCourseSelect }: DashboardOverviewProps) {
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [lastWatched, setLastWatched] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.id) {
      // Parallelize both fetches for faster initial load
      Promise.all([
        fetchEnrollments(),
        fetchLastWatched()
      ]);
    }
  }, [userData?.id]);

  async function fetchEnrollments() {
    try {
      setLoading(true);
      
      // Fetch both enrollments and authored courses in parallel
      const [enrollmentsRes, authoredRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select(`
            *,
            course:courses (
              *,
              instructor:profiles (
                full_name,
                avatar_url
              )
            )
          `)
          .eq('user_id', userData.id),
        supabase
          .from('courses')
          .select(`
            *,
            instructor:profiles (
              full_name,
              avatar_url
            )
          `)
          .eq('instructor_id', userData.id)
      ]);

      if (enrollmentsRes.error) throw enrollmentsRes.error;
      if (authoredRes.error) throw authoredRes.error;

      const enrollments = enrollmentsRes.data || [];
      const authoredCourses = authoredRes.data || [];

      // Merge and deduplicate
      const enrollmentCourseIds = new Set(enrollments.map(e => e.course_id));
      
      const teacherEnrollments = authoredCourses
        .filter(c => !enrollmentCourseIds.has(c.id))
        .map(c => ({
          id: `instructor-${c.id}`,
          course_id: c.id,
          user_id: userData.id,
          progress: 100, // Instructors see 100% progress
          is_instructor_view: true,
          course: c
        }));

      const allCourses = [...enrollments, ...teacherEnrollments];
      setEnrolledCourses(allCourses);
      return allCourses;
    } catch (error: any) {
      console.error('Erro ao buscar inscrições:', error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function fetchLastWatched() {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select(`
          watched_time,
          course:courses (*),
          lesson:lessons (
            *,
            module:modules (
              title,
              order_index
            )
          )
        `)
        .eq('user_id', userData.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setLastWatched(data);
      } else {
        // Fallback: Use most recent enrollment if no progress yet
        const { data: latestEnrollment } = await supabase
          .from('enrollments')
          .select('*, course:courses(*)')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestEnrollment) {
          setLastWatched({
            course: latestEnrollment.course,
            watched_time: 0,
            lesson: null
          });
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar último curso:', error.message);
    }
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-3 md:p-8 max-w-[1600px] mx-auto pb-20 space-y-8 md:space-y-12"
    >
      <motion.div variants={itemVariants}>
        <HeroSection 
          lastWatched={lastWatched} 
          onContinue={() => lastWatched && onCourseSelect(lastWatched.course.id)}
        />
      </motion.div>

      {/* Meus Cursos */}
      <section className="mb-0">
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3">
            <h2 className="text-lg md:text-2xl font-bold text-white">Meus Cursos</h2>
            <span className="px-2 py-0.5 bg-[#22ff88]/10 text-[#22ff88] text-[8px] md:text-[10px] font-bold rounded-md uppercase tracking-wider">
              {enrolledCourses.length} {enrolledCourses.length === 1 ? 'Ativo' : 'Ativos'}
            </span>
          </div>
          <button className="text-[10px] md:text-sm font-medium text-[#64748b] hover:text-white transition-colors">
            Ver todos
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 md:p-20">
            <Loader2 className="w-6 h-6 md:w-8 h-8 text-[#22ff88] animate-spin" />
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="bg-[#1a1c22] rounded-[2rem] md:rounded-[2.5rem] border border-white/5 p-10 md:p-16 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-6 h-6 md:w-8 h-8 text-[#64748b]" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">Você ainda não tem cursos</h3>
            <p className="text-sm md:text-[#64748b] mb-4">Explore nossa Vitrine e comece sua jornada hoje.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {enrolledCourses.map((enrollment, i) => (
              <motion.div key={enrollment.id} variants={itemVariants}>
                <CourseCard 
                  image={enrollment.course.cover_url || "https://images.unsplash.com/photo-1541829070764-84a7d30dee73?w=800"} 
                  title={enrollment.course.title} 
                  mentor={enrollment.course.instructor?.full_name || 'Especialista'} 
                  progress={enrollment.progress || 0} 
                  onClick={() => onCourseSelect(enrollment.course.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Recomendados */}
      <section>
        <h2 className="text-lg md:text-2xl font-bold text-white mb-4 md:mb-8">Recomendados para Você</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {recommended.map((item, i) => (
            <motion.div key={i} variants={itemVariants}>
              <FeaturedCard {...item} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Novidades */}
      <section>
        <h2 className="text-lg md:text-2xl font-bold text-white mb-4 md:mb-8">Novidades da Semana</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {weekly.map((item, i) => (
            <motion.div key={i} variants={itemVariants}>
              <WeeklyCard {...item} />
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
