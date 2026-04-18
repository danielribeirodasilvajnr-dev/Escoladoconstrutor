import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Layout, Zap, Shield, MousePointer2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  onExplore: () => void;
}

export function LandingPage({ onExplore }: LandingPageProps) {
  const [courses, setCourses] = useState<any[]>([]);
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
        <button 
          onClick={onExplore}
          className="px-6 py-2 bg-accent text-black rounded-full text-[11px] uppercase tracking-widest font-bold hover:scale-105 active:scale-95 shadow-xl shadow-accent/10 transition-all"
        >
          Começar Agora
        </button>
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
            <p className="text-lg text-muted max-w-2xl leading-relaxed mb-10">
              Aprenda com especialistas e domine as técnicas que impulsionam o setor da construção. 
              Da teoria à prática, transforme aprendizado em resultados reais.
            </p>
            <div className="flex items-center gap-6">
              <button 
                onClick={onExplore}
                className="group flex items-center gap-2 px-8 py-4 bg-accent text-black rounded-full text-sm font-bold shadow-2xl shadow-accent/20 hover:bg-accent/90 transition-all"
              >
                Começar Agora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            {/* Immersive Image Display - Recipe 12 Style */}
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src="https://picsum.photos/seed/aurora-abstract/1200/1500" 
                alt="Abstract Creative"
                className="w-full h-full object-cover opacity-60 grayscale hover:opacity-100 transition-opacity duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
              
              {/* Floating Feature Bubble - Recipe 11 */}
              <motion.div 
                animate={{ y: [0, -10, 0], rotate: [-6, -4, -6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-12 -left-12 p-6 bg-surface border border-white/5 rounded-3xl shadow-2xl flex items-center gap-4 hidden md:flex"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                  <Layout className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Workspace</div>
                  <div className="text-sm font-medium text-white">Smart Canvas v2.0</div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0], rotate: [2, 4, 2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-12 -right-12 p-6 bg-surface border border-white/5 rounded-3xl shadow-2xl flex items-center gap-4 hidden md:flex"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Performance</div>
                  <div className="text-sm font-medium text-white">99.9% Faster Rendering</div>
                </div>
              </motion.div>
            </div>

            {/* Background elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] -z-10" />
          </motion.div>
        </section>

        {/* Vitrine de Cursos Pública */}
        {courses.length > 0 && (
          <section className="px-8 max-w-7xl mx-auto mt-24 mb-10 relative">
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
          <div className="grid md:grid-cols-3 gap-1px bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
            {[
              { icon: Sparkles, title: "IA Aprimorada", desc: "Nossa ferramenta neural prevê seu próximo passo, sugerindo recursos e estilos enquanto você cria." },
              { icon: Shield, title: "Nível Corporativo", desc: "Segurança de nível bancário para seu PI mais valioso. Funções, permissões e logs de auditoria incluídos." },
              { icon: MousePointer2, title: "Colaborativo", desc: "A experiência de colaboração em tempo real mais suave já construída para ferramentas de engenharia." }
            ].map((feature, i) => (
              <div key={i} className="bg-[#050505] p-12 hover:bg-[#0f1115] transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-[#22ff88]/10 text-[#22ff88] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl mb-4 font-display font-bold text-white">{feature.title}</h3>
                <p className="text-[#64748b] leading-relaxed">{feature.desc}</p>
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
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </div>
  );
}
