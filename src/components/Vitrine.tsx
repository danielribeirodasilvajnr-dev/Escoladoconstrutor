import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Star, Users, Play, Globe, Loader2, Award, Zap, BookOpen, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { CheckoutModal } from './CheckoutModal';
import { CurriculumPreviewModal } from './CurriculumPreviewModal';
import { cn } from '../lib/utils';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_url: string;
  price: number;
  is_blocked: boolean;
  instructor_id: string;
  instructor: {
    full_name: string;
    avatar_url: string;
  } | null;
  students_count: number;
  rating: number;
  created_at: string;
}

interface VitrineProps {
  userData: any;
  onViewChange: (view: string) => void;
}

export function Vitrine({ userData, onViewChange }: VitrineProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewingCurriculum, setViewingCurriculum] = useState<Course | null>(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCourses, setTotalCourses] = useState(0);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const PAGE_SIZE = 12;

  // Dynamic categories based on fetched stats
  const dynamicCategories = ['Todas', ...Object.keys(categoryStats).sort((a, b) => a.localeCompare(b))];

  const getCategoryCount = (cat: string) => {
    if (cat === 'Todas') return totalCourses;
    return categoryStats[cat] || 0;
  };

  useEffect(() => {
    fetchCategoryStats();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPublishedCourses(false);
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory, sortBy]);

  async function fetchCategoryStats() {
    try {
      // Lightweight fetch just for counts
      const { data, error } = await supabase
        .from('courses')
        .select('category')
        .eq('is_published', true);
        
      if (!error && data) {
        const stats = data.reduce((acc, course) => {
          const cat = course.category || 'Outros';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        setCategoryStats(stats);
      }
    } catch (err) {
      console.error('Error fetching stats', err);
    }
  }

  async function fetchPublishedCourses(isLoadMore = false) {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const currentPage = isLoadMore ? page : 0;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles (
            full_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('is_published', true);

      if (selectedCategory !== 'Todas') {
        query = query.eq('category', selectedCategory);
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      // Ordering
      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'alpha':
          query = query.order('title', { ascending: true });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      if (isLoadMore) {
        setCourses(prev => {
          const newCourses = data as any[] || [];
          const existingIds = new Set(prev.map(c => c.id));
          return [...prev, ...newCourses.filter(c => !existingIds.has(c.id))];
        });
      } else {
        setCourses((data as any[]) || []);
      }

      if (count !== null) setTotalCourses(count);
      setHasMore(count ? from + (data?.length || 0) < count : false);
      
      if (!isLoadMore) setPage(1);
      else setPage(p => p + 1);

    } catch (error: any) {
      console.error('Erro ao buscar cursos da vitrine:', error.message);
      toast.error('Erro ao carregar vitrine: ' + error.message);
    } finally {
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  }



  return (
    <div className="p-3 md:p-10 max-w-[1600px] mx-auto space-y-6 md:space-y-12 pb-20 mt-2 md:mt-4">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-8 md:mb-16 mt-4 md:mt-0">
        <div className="max-w-xl text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#22ff88]/10 rounded-xl flex items-center justify-center border border-[#22ff88]/20">
              <Globe className="w-4 h-4 md:w-5 md:h-5 text-[#22ff88]" />
            </div>
            <span className="text-[8px] md:text-[10px] font-bold text-[#22ff88] uppercase tracking-[0.2em]">Marketplace Global</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 md:mb-6 leading-tight">
            Vitrine de <span className="text-[#22ff88]">Elite</span>
          </h1>
          <p className="text-[#64748b] text-sm md:text-lg leading-relaxed px-4 lg:px-0">
            Descubra treinamentos cinematográficos e acelere sua carreira com os maiores especialistas.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 bg-[#1a1c22] p-2 rounded-2xl border border-white/5 self-center lg:self-end">
          <div className="px-4 md:px-6 py-2 md:py-4 flex flex-col items-center">
            <span className="text-xl md:text-2xl font-bold text-white leading-none">{totalCourses}</span>
            <span className="text-[8px] md:text-[9px] font-bold text-[#64748b] uppercase tracking-widest mt-1">Cursos Ativos</span>
          </div>
          <div className="w-[1px] h-8 md:h-10 bg-white/5" />
          <div className="px-4 md:px-6 py-2 md:py-4 flex flex-col items-center">
            <span className="text-xl md:text-2xl font-bold text-[#22ff88] leading-none">High</span>
            <span className="text-[8px] md:text-[9px] font-bold text-[#64748b] uppercase tracking-widest mt-1">Nível Técnico</span>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-6 mb-8 md:mb-16 px-1 md:px-0">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] group-focus-within:text-[#22ff88] transition-colors" />
          <input
            type="text"
            placeholder="O que deseja aprender?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1c22] border border-white/5 rounded-2xl pl-12 pr-5 py-3.5 md:py-5 text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium text-sm md:text-lg placeholder:text-[#334155]"
          />
        </div>
        <div className="relative group">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "h-12 md:h-16 px-6 md:px-8 bg-[#1a1c22] rounded-2xl border flex items-center justify-center gap-3 transition-all font-bold uppercase tracking-widest text-[10px] shrink-0",
              isFilterOpen ? "border-[#22ff88]/40 text-white" : "border-white/5 text-[#64748b] hover:text-white hover:border-white/10"
            )}
          >
            <Filter className={cn("w-4 h-4 transition-transform", isFilterOpen && "rotate-180")} />
            Filtros
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsFilterOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-4 w-[280px] md:w-[320px] bg-[#1a1c22] border border-white/10 rounded-3xl p-6 shadow-2xl z-50 backdrop-blur-xl"
                >
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] block mb-4">Categoria</span>
                      <div className="flex flex-wrap gap-2">
                        {dynamicCategories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                              selectedCategory === cat 
                                ? "bg-[#22ff88] text-black" 
                                : "bg-white/5 text-[#64748b] hover:text-white hover:bg-white/10"
                            )}
                          >
                            {cat}
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-md text-[8px] font-black",
                              selectedCategory === cat ? "bg-black/20 text-black" : "bg-white/5 text-[#64748b]"
                            )}>
                              {getCategoryCount(cat)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] block mb-4">Ordenação</span>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'recent', label: 'Mais Recente' },
                          { id: 'price-low', label: 'Menor Preço' },
                          { id: 'price-high', label: 'Maior Preço' },
                          { id: 'alpha', label: 'Ordem Alfabética' }
                        ].map(option => (
                          <button
                            key={option.id}
                            onClick={() => setSortBy(option.id)}
                            className={cn(
                              "px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-left transition-all flex items-center justify-between",
                              sortBy === option.id 
                                ? "bg-[#22ff88]/10 text-[#22ff88] border border-[#22ff88]/20" 
                                : "bg-white/5 text-[#64748b] border border-transparent hover:bg-white/10 hover:text-white"
                            )}
                          >
                            {option.label}
                            {sortBy === option.id && <div className="w-1.5 h-1.5 rounded-full bg-[#22ff88]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCategory('Todas');
                        setSortBy('recent');
                        setIsFilterOpen(false);
                      }}
                      className="w-full pt-4 border-t border-white/5 text-[9px] font-bold text-[#64748b] uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#1a1c22] aspect-[4/5] rounded-[2.5rem] md:rounded-[3rem] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-[#1a1c22] rounded-[2.5rem] md:rounded-[3rem] border border-white/5 p-12 md:p-20 text-center">
          <Zap className="w-12 h-12 md:w-16 md:h-16 text-[#64748b] mx-auto mb-6 md:mb-8 opacity-20" />
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Nenhum curso encontrado</h2>
          <p className="text-[#64748b] text-sm md:text-base">Tente buscar por termos mais genéricos ou explore as categorias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-[#1a1c22] rounded-[2.5rem] md:rounded-[3rem] border border-white/5 overflow-hidden flex flex-col hover:border-[#22ff88]/20 transition-all duration-500 shadow-2xl hover:shadow-[#22ff88]/5"
            >
              <div 
                className={cn(
                  "aspect-video relative overflow-hidden",
                  !course.is_blocked && "group-hover:cursor-pointer"
                )} 
                onClick={() => !course.is_blocked && setSelectedCourse(course)}
              >
                <img
                  src={course.cover_url || "https://images.unsplash.com/photo-1541829070764-84a7d30dee73?w=800"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt={course.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                <div className="absolute top-4 md:top-6 left-4 md:left-6">
                  <div className="bg-black/60 backdrop-blur-md px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <span className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-[#22ff88] animate-pulse" />
                    <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest">
                      {course.category || 'MASTERCLASS'}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-4 md:bottom-6 left-6 md:left-8 right-6 md:right-8 flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#2a2d35] to-[#1a1c22] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                      {course.instructor?.avatar_url ? (
                        <img
                          src={course.instructor.avatar_url}
                          className="w-full h-full object-cover"
                          alt={course.instructor.full_name}
                        />
                      ) : (
                        <span className="text-[10px] md:text-sm font-bold text-[#64748b]">
                          {course.instructor?.full_name?.charAt(0) || 'E'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                      <span className="text-[8px] font-bold text-[#22ff88] uppercase tracking-widest leading-none mb-0.5">Professor</span>
                      <span className="text-[10px] md:text-xs font-bold text-white truncate">{course.instructor?.full_name || 'Especialista'}</span>
                    </div>
                </div>
              </div>

              <div className="p-5 md:p-8 flex-1 flex flex-col">
                <h3 className="text-lg md:text-2xl font-bold text-white mb-3 leading-tight group-hover:text-[#22ff88] transition-colors">
                  {course.title}
                </h3>

                <div className="flex items-center gap-3 md:gap-6 mb-5 md:mb-8 text-[#64748b]">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{course.students_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#22ff88]" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white">{Number(course.rating).toFixed(1)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setViewingCurriculum(course)}
                  className="w-full h-11 md:h-12 mb-6 bg-white/5 text-[#64748b] font-black text-[9px] md:text-[10px] uppercase tracking-widest rounded-xl md:rounded-2xl border border-white/10 hover:text-[#22ff88] hover:border-[#22ff88]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                   <BookOpen className="w-3.5 h-3.5" />
                  Ver Grade Curricular
                </button>

                <div className="mt-auto pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-[#64748b] uppercase tracking-widest">Investimento</span>
                    <span className="text-lg md:text-2xl font-black text-white">R$ {course.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <button
                    onClick={() => !course.is_blocked && setSelectedCourse(course)}
                    disabled={course.is_blocked}
                    className={cn(
                      "h-11 md:h-14 px-5 md:px-8 font-black text-[9px] md:text-[10px] uppercase tracking-widest rounded-xl md:rounded-2xl border transition-all active:scale-95 flex items-center justify-center gap-2",
                      course.is_blocked 
                        ? "bg-white/5 text-[#64748b] border-white/10 cursor-not-allowed opacity-50" 
                        : "bg-[#22ff88]/10 text-[#22ff88] border-[#22ff88]/10 hover:bg-[#22ff88] hover:text-black hover:border-transparent"
                    )}
                  >
                    {course.is_blocked ? 'EM BREVE' : 'Iniciar'}
                    {course.is_blocked ? <Lock className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && courses.length > 0 && (
        <div className="pt-8 flex justify-center">
          <button
            onClick={() => fetchPublishedCourses(true)}
            disabled={loadingMore}
            className="px-8 py-3.5 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 border border-white/10"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#22ff88]" />
            ) : (
              <Zap className="w-4 h-4 text-[#22ff88]" />
            )}
            {loadingMore ? 'Carregando...' : 'Carregar mais cursos'}
          </button>
        </div>
      )}

      <AnimatePresence>
        {selectedCourse && (
          <CheckoutModal
            course={selectedCourse}
            userId={userData.id}
            onClose={() => setSelectedCourse(null)}
            onSuccess={() => {
              setSelectedCourse(null);
              onViewChange('overview');
            }}
          />
        )}
        {viewingCurriculum && (
          <CurriculumPreviewModal
            courseId={viewingCurriculum.id}
            courseTitle={viewingCurriculum.title}
            isBlocked={viewingCurriculum.is_blocked}
            onClose={() => setViewingCurriculum(null)}
            onAction={() => {
              const course = viewingCurriculum;
              setViewingCurriculum(null);
              setSelectedCourse(course);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
