import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Layout, Zap, Shield, MousePointer2, ChevronLeft, ChevronRight, Trophy, TrendingUp, Users, Search, User, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  onExplore: () => void;
}

export function LandingPage({ onExplore }: LandingPageProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('courses').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setCourses(data);
    });
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const categories = ['Todos', 'Gestão', 'Orçamentos', 'Projetos BIM', 'Tecnologia', 'Execução'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' ||
      course.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(selectedCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-[#22ff88] selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-xl bg-[#050505]/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#22ff88] rounded-lg flex items-center justify-center shadow-lg shadow-[#22ff88]/20">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-display text-xl tracking-tighter font-bold">Construtor360</span>
        </div>
        <div className="hidden md:flex gap-8 text-[11px] uppercase tracking-widest font-bold text-muted">
          <a href="#" className="hover:text-ink transition-colors">Plataforma</a>
          <a href="#" className="hover:text-ink transition-colors">Recursos</a>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => { window.location.hash = 'login'; }}
            className="hidden md:flex px-6 py-2 bg-[#22ff88] text-black rounded-full text-[11px] uppercase tracking-widest font-bold hover:scale-105 active:scale-95 shadow-xl shadow-[#22ff88]/10 transition-all"
          >
            Fazer Login
          </button>
          <button
            onClick={() => { window.location.hash = 'register'; }}
            className="px-6 py-2 bg-white/5 text-white rounded-full text-[11px] uppercase tracking-widest font-bold hover:bg-white/10 active:scale-95 transition-all"
          >
            Inscreva-se
          </button>
        </div>
      </nav>

      <main className="pt-32">
        {/* Hero Section */}
        <section className="px-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-6xl md:text-[80px] leading-[1.1] font-display font-bold tracking-tighter mb-8 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              Eleve seu conhecimento. <br />
              <span className="text-[#22ff88]">Construa seu futuro.</span>
            </h1>
            <p className="text-lg text-[#64748b] max-w-2xl leading-relaxed mb-6">
              Aprenda com especialistas e domine as técnicas que impulsionam o setor da construção.
              Da teoria à prática, transforme aprendizado em resultados reais.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            {/* Immersive Image Display - Recipe 12 Style */}
            <div className="relative aspect-square sm:aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-white/5 flex items-center justify-center p-8">
              <img
                src="/sticker_transparent.png"
                alt="Sticker de Sucesso"
                className="w-full h-full object-contain transition-transform duration-700 hover:scale-105 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
              />
            </div>

            {/* Background elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#22ff88]/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] -z-10" />
          </motion.div>
        </section>

        {/* Vitrine de Cursos Pública */}
        {courses.length > 0 && (
          <section className="px-8 max-w-7xl mx-auto mt-24 relative">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-white mb-4">
                  Cursos em <span className="text-[#22ff88]">Destaque</span>
                </h2>
                <p className="text-[#64748b] text-lg max-w-xl">
                  Inscreva-se nos nossos treinamentos mais avançados e experimente a melhor plataforma da engenharia.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => scroll('left')}
                  className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/20 active:scale-95 transition-all text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/20 active:scale-95 transition-all text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative group/slider">
              {/* Fade Spans for Edges */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

              <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 pt-4 -mx-4 px-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {courses.map(course => (
                  <div key={course.id} className="min-w-[320px] md:min-w-[360px] w-[320px] md:w-[360px] bg-[#0f1115] rounded-[2rem] overflow-hidden border border-white/5 group hover:border-white/10 transition-all snap-center md:snap-start flex flex-col hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#22ff88]/5">
                    <div className="relative aspect-[16/10] overflow-hidden bg-black/50">
                      <img
                        src={course.cover_url || "https://picsum.photos/seed/placeholder/800/450"}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent" />
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-[#22ff88]">
                        Mais Vendido
                      </div>
                    </div>
                    <div className="p-8 pt-6 flex flex-col flex-1">
                      <h3 className="text-xl font-bold font-display text-white mb-3 line-clamp-2 transition-colors leading-tight">
                        {course.title}
                      </h3>
                      <p className="text-sm text-[#64748b] leading-relaxed line-clamp-2 mb-8 flex-1">
                        {course.description || "Aprenda e domine as melhores práticas nesta masterclass focada totalmente pro desenvolvimento prático."}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-white font-bold font-display text-xl">
                          {Number(course.price) === 0 ? 'Grátis' : `R$ ${Number(course.price).toFixed(2).replace('.', ',')}`}
                        </div>
                        <button
                          onClick={() => window.location.search = `?c=${course.id}`}
                          className="px-6 py-3 bg-[#22ff88]/10 hover:bg-[#22ff88] text-[#22ff88] hover:text-black font-bold text-sm tracking-wide rounded-xl transition-all shadow-lg shadow-[#22ff88]/0 hover:shadow-[#22ff88]/20"
                        >
                          Experimentar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}


        {/* Scrolling Rail - Recipe 11 */}
        <div className="relative py-20 overflow-hidden border-y border-ink/5 mt-10">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-20 whitespace-nowrap whitespace-pre text-8xl font-display font-medium opacity-5 uppercase tracking-tighter"
          >
            <span>Inovação</span>
            <span>·</span>
            <span>Criatividade</span>
            <span>·</span>
            <span>Futuro</span>
            <span>·</span>
            <span>Construtor360</span>
            <span>·</span>
            <span>Computação Espacial</span>
            <span>·</span>
            <span>Computação Espacial</span>
            <span>·</span>
            <span>Inovação</span>
            <span>·</span>
          </motion.div>
        </div>

        {/* Grid Features - Recipe 8/1 Pattern */}
        <section className="px-8 py-32 max-w-7xl mx-auto">
          <div className="flex flex-col items-center mb-16 space-y-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-white mb-2">
              Por que a <span className="text-[#22ff88]">Construtor360</span>?
            </h2>
            <p className="text-[#64748b] text-lg max-w-2xl">
              Não somos apenas uma plataforma de cursos. Somos o seu acelerador definitivo de carreira e negócios na construção civil.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-1px bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
            {[
              {
                icon: Trophy,
                title: "Expertise de Mercado",
                desc: "Diga adeus à teoria vazia. Aprenda o que funciona na vida real com metodologias de gestão testadas e aprovadas em canteiros de alto padrão."
              },
              {
                icon: TrendingUp,
                title: "Foco em Lucratividade",
                desc: "Evolua de um técnico para um empresário. Domine orçamentos precisos, contratos blindados e técnicas de captação de clientes premium."
              },
              {
                icon: Users,
                title: "Networking de Elite",
                desc: "Você não está sozinho. Faça parte de uma comunidade exclusiva de profissionais da construção civil e estabeleça parcerias que valem ouro."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-[#050505] p-12 hover:bg-[#0a0c0f] transition-all duration-500 group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#22ff88] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
                <div className="w-14 h-14 rounded-2xl bg-[#22ff88]/5 border border-[#22ff88]/20 text-[#22ff88] flex items-center justify-center mb-8 group-hover:bg-[#22ff88] group-hover:text-black transition-all duration-500 shadow-xl shadow-[#22ff88]/0 group-hover:shadow-[0_0_30px_rgba(34,255,136,0.3)]">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl mb-4 font-display font-bold text-white group-hover:text-[#22ff88] transition-colors">{feature.title}</h3>
                <p className="text-[#64748b] leading-relaxed text-[15px] group-hover:text-white/70 transition-colors">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-8 py-12 border-t border-ink/5 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2 grayscale-0">
          <Sparkles className="w-4 h-4 text-[#22ff88]" />
          <span className="font-display text-lg font-bold">Construtor360</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-[#64748b] font-bold">
          © 2026 Construtor360. Todos os direitos reservados.
        </div>
      </footer>

      {/* Hide Scrollbar Styles via Inline Tags since globals css isn't verified here */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </div>
  );
}
