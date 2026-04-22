import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Layout, Zap, Shield, MousePointer2, ChevronLeft, ChevronRight, Trophy, TrendingUp, Users, Search, User, UserPlus, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  onExplore: () => void;
  onAuth: () => void;
}

export function LandingPage({ onExplore, onAuth }: LandingPageProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2026-05-01T00:00:00').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-[#22ff88] selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-4 md:py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-xl bg-[#050505]/60 transition-all">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#22ff88] rounded-lg flex items-center justify-center shadow-lg shadow-[#22ff88]/20">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-display text-lg md:text-xl tracking-tighter font-bold">Construtor360</span>
        </div>
        
        <div className="hidden md:flex gap-8 text-[11px] uppercase tracking-widest font-bold text-muted">
          <a href="#" className="hover:text-ink transition-colors">Plataforma</a>
          <a href="#" className="hover:text-ink transition-colors">Recursos</a>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex gap-4">
            <button
              onClick={onAuth}
              className="px-6 py-2 bg-[#22ff88] text-black rounded-full text-[11px] uppercase tracking-widest font-bold hover:scale-105 active:scale-95 shadow-xl shadow-[#22ff88]/10 transition-all"
            >
              Fazer Login
            </button>
            <button
              onClick={onAuth}
              className="px-6 py-2 bg-white/5 text-white rounded-full text-[11px] uppercase tracking-widest font-bold hover:bg-white/10 active:scale-95 transition-all"
            >
              Inscreva-se
            </button>
          </div>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-40 bg-[#050505] pt-24 px-8 md:hidden"
          >
            <div className="flex flex-col gap-6">
              <a href="#" className="text-2xl font-bold border-b border-white/5 pb-4">Plataforma</a>
              <a href="#" className="text-2xl font-bold border-b border-white/5 pb-4">Recursos</a>
              <div className="flex flex-col gap-4 mt-8">
                <button
                  onClick={() => { onAuth(); setIsMenuOpen(false); }}
                  className="w-full py-4 bg-[#22ff88] text-black rounded-2xl text-sm uppercase tracking-widest font-bold"
                >
                  Fazer Login
                </button>
                <button
                  onClick={() => { onAuth(); setIsMenuOpen(false); }}
                  className="w-full py-4 bg-white/5 text-white rounded-2xl text-sm uppercase tracking-widest font-bold"
                >
                  Criar Conta
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-24 md:pt-32">
        {/* Hero Section */}
        <section className="px-4 md:px-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-16 items-center min-h-[70vh] md:min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl sm:text-6xl md:text-[80px] leading-[1.1] font-display font-bold tracking-tighter mb-6 md:mb-8 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              Eleve seu conhecimento. <br />
              <span className="text-[#22ff88]">Construa seu futuro.</span>
            </h1>
            <p className="text-base md:text-lg text-[#64748b] max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8">
              Aprenda com especialistas e domine as técnicas que impulsionam o setor da construção.
              Da teoria à prática, transforme aprendizado em resultados reais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={onExplore}
                className="px-8 py-4 bg-[#22ff88] text-black rounded-2xl font-bold flex items-center justify-center gap-2 group hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#22ff88]/10"
              >
                Explorar Cursos
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative flex items-center justify-center py-10 md:py-0"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-[600px] relative z-10">
                {[
                    { label: 'DIAS', value: timeLeft.days },
                    { label: 'HORAS', value: timeLeft.hours },
                    { label: 'MINUTOS', value: timeLeft.minutes },
                    { label: 'SEGUNDOS', value: timeLeft.seconds }
                ].map((unit, i) => (
                    <motion.div 
                        key={unit.label}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.6 + (i * 0.1) }}
                        className="bg-[#1a1c22]/40 backdrop-blur-xl border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#22ff88]/30 transition-all duration-500 shadow-2xl hover:shadow-[#22ff88]/5"
                    >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#22ff88]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="text-4xl md:text-6xl font-black text-white mb-2 md:mb-3 tracking-tighter group-hover:text-[#22ff88] transition-colors leading-none">
                            {String(unit.value).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] md:text-[10px] font-black text-[#64748b] uppercase tracking-widest leading-none">{unit.label}</span>
                        
                        {/* Subtle accent border */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-[#22ff88]/20 group-hover:w-full transition-all duration-700" />
                    </motion.div>
                ))}
            </div>
            
            {/* Launching label floating above */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -top-8 md:-top-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 whitespace-nowrap"
            >
                <div className="w-1.5 h-1.5 rounded-full bg-[#22ff88] animate-pulse" />
                <span className="text-[10px] md:text-xs font-black text-[#22ff88] uppercase tracking-[0.4em]">Plataforma em Lançamento</span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#22ff88] animate-pulse" />
            </motion.div>

            {/* Background decorative glows */}
            <div className="absolute -top-20 -right-20 w-64 md:w-96 h-64 md:h-96 bg-[#22ff88]/10 rounded-full blur-[100px] md:blur-[150px] -z-10 animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-80 md:w-[500px] h-80 md:h-[500px] bg-blue-500/5 rounded-full blur-[100px] md:blur-[150px] -z-10" />
          </motion.div>
        </section>

        {/* Vitrine de Cursos Pública */}
        {courses.length > 0 && (
          <section className="px-4 md:px-8 max-w-7xl mx-auto mt-20 md:mt-24 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-white mb-4">
                  Cursos em <span className="text-[#22ff88]">Destaque</span>
                </h2>
                <p className="text-[#64748b] text-base md:text-lg max-w-xl mx-auto md:mx-0">
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

            <div className="relative group/slider -mx-4 px-4 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

              <div
                ref={scrollRef}
                className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 pt-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {courses.map(course => (
                  <div key={course.id} className="min-w-[280px] sm:min-w-[320px] md:min-w-[360px] w-[280px] sm:w-[320px] md:w-[360px] bg-[#0f1115] rounded-[2rem] overflow-hidden border border-white/5 group hover:border-white/10 transition-all snap-center md:snap-start flex flex-col hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#22ff88]/5">
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
                    <div className="p-6 md:p-8 pt-6 flex flex-col flex-1">
                      <h3 className="text-lg md:text-xl font-bold font-display text-white mb-3 line-clamp-2 transition-colors leading-tight">
                        {course.title}
                      </h3>
                      <p className="text-xs md:text-sm text-[#64748b] leading-relaxed line-clamp-2 mb-6 md:mb-8 flex-1">
                        {course.description || "Aprenda e domine as melhores práticas nesta masterclass focada totalmente pro desenvolvimento prático."}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-white font-bold font-display text-lg md:text-xl">
                          {Number(course.price) === 0 ? 'Grátis' : `R$ ${Number(course.price).toFixed(2).replace('.', ',')}`}
                        </div>
                        <button
                          onClick={() => window.location.search = `?c=${course.id}`}
                          className="px-4 md:px-6 py-2.5 md:py-3 bg-[#22ff88]/10 hover:bg-[#22ff88] text-[#22ff88] hover:text-black font-bold text-xs md:text-sm tracking-wide rounded-xl transition-all"
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

        {/* Scrolling Rail */}
        <div className="relative py-12 md:py-20 overflow-hidden border-y border-white/5 mt-10">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-10 md:gap-20 whitespace-nowrap whitespace-pre text-6xl md:text-8xl font-display font-medium opacity-5 uppercase tracking-tighter"
          >
            <span>Inovação</span>
            <span>·</span>
            <span>Criatividade</span>
            <span>·</span>
            <span>Futuro</span>
            <span>·</span>
            <span>Construtor360</span>
            <span>·</span>
            <span>Engenharia</span>
            <span>·</span>
            <span>Engenharia</span>
            <span>·</span>
            <span>Inovação</span>
            <span>·</span>
          </motion.div>
        </div>

        {/* Grid Features */}
        <section className="px-4 md:px-8 py-20 md:py-32 max-w-7xl mx-auto">
          <div className="flex flex-col items-center mb-12 md:mb-16 space-y-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-white mb-2">
              Por que a <span className="text-[#22ff88]">Construtor360</span>?
            </h2>
            <p className="text-[#64748b] text-base md:text-lg max-w-2xl">
              Não somos apenas uma plataforma de cursos. Somos o seu acelerador definitivo de carreira e negócios na construção civil.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
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
              <div key={i} className="bg-[#050505] p-8 md:p-12 hover:bg-[#0a0c0f] transition-all duration-500 group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#22ff88] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#22ff88]/5 border border-[#22ff88]/20 text-[#22ff88] flex items-center justify-center mb-6 md:mb-8 group-hover:bg-[#22ff88] group-hover:text-black transition-all duration-500 shadow-xl shadow-[#22ff88]/0 group-hover:shadow-[0_0_30px_rgba(34,255,136,0.3)]">
                  <feature.icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <h3 className="text-xl md:text-2xl mb-4 font-display font-bold text-white group-hover:text-[#22ff88] transition-colors">{feature.title}</h3>
                <p className="text-[#64748b] leading-relaxed text-[14px] md:text-[15px] group-hover:text-white/70 transition-colors">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-4 md:px-8 py-12 border-t border-white/5 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#22ff88]" />
          <span className="font-display text-lg font-bold">Construtor360</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-[#64748b] font-bold text-center">
          © 2026 Construtor360. Todos os direitos reservados.
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </div>
  );
}
