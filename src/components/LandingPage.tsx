import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Layout, Zap, Shield, MousePointer2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingPageProps {
  onExplore: () => void;
}

export function LandingPage({ onExplore }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-paper overflow-hidden selection:bg-accent selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center border-b border-ink/5 backdrop-blur-sm bg-paper/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl tracking-tighter font-bold">Escola do Construtor</span>
        </div>
        <div className="hidden md:flex gap-8 text-[11px] uppercase tracking-widest font-bold text-muted">
          <a href="#" className="hover:text-ink transition-colors">Platform</a>
          <a href="#" className="hover:text-ink transition-colors">Resources</a>
          <a href="#" className="hover:text-ink transition-colors">Enterprise</a>
        </div>
        <button 
          onClick={onExplore}
          className="px-6 py-2 bg-ink text-paper rounded-full text-[11px] uppercase tracking-widest font-bold hover:scale-105 active:scale-95 shadow-xl shadow-ink/10 transition-all"
        >
          Get Started
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
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] uppercase tracking-[0.2em] font-bold mb-8 border border-accent/20"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Intelligence Driven Design
            </motion.div>
            <h1 className="text-7xl md:text-[96px] leading-[0.9] font-display font-bold tracking-tighter mb-8 bg-gradient-to-br from-ink to-ink/60 bg-clip-text text-transparent">
              Elevate <br />
              Digital <br />
              <span className="text-accent underline decoration-accent/20 underline-offset-8">Experiences.</span>
            </h1>
            <p className="text-lg text-muted max-w-md leading-relaxed mb-10">
              The neural operating system for modern creative teams. 
              Automate the mundane. Focus on what matters: the craft.
            </p>
            <div className="flex items-center gap-6">
              <button 
                onClick={onExplore}
                className="group flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full text-sm font-bold shadow-2xl shadow-accent/30 hover:bg-accent/90 transition-all"
              >
                Launch Console
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="text-sm font-bold border-b-2 border-ink/5 pb-1 hover:border-accent/40 transition-colors">
                Read Whitepaper
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
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-ink/10 shadow-2xl">
              <img 
                src="https://picsum.photos/seed/aurora-abstract/1200/1500" 
                alt="Abstract Creative"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
              
              {/* Floating Feature Bubble - Recipe 11 */}
              <motion.div 
                animate={{ y: [0, -10, 0], rotate: [-6, -4, -6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-12 -left-12 p-6 bg-white outline outline-1 outline-ink/10 rounded-3xl shadow-xl flex items-center gap-4 hidden md:flex"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                  <Layout className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink/40 font-bold">Workspace</div>
                  <div className="text-sm font-medium">Smart Canvas v2.0</div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0], rotate: [2, 4, 2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-12 -right-12 p-6 bg-white outline outline-1 outline-ink/10 rounded-3xl shadow-xl flex items-center gap-4 hidden md:flex"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink/40 font-bold">Performance</div>
                  <div className="text-sm font-medium">99.9% Faster Rendering</div>
                </div>
              </motion.div>
            </div>

            {/* Background elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] -z-10" />
          </motion.div>
        </section>

        {/* Scrolling Rail - Recipe 11 */}
        <div className="relative py-20 overflow-hidden border-y border-ink/5 mt-20">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-20 whitespace-nowrap whitespace-pre text-8xl font-display font-medium opacity-5 uppercase tracking-tighter"
          >
            <span>Innovation</span>
            <span>·</span>
            <span>Creativity</span>
            <span>·</span>
            <span>Future</span>
            <span>·</span>
            <span>Escola do Construtor</span>
            <span>·</span>
            <span>Spatial Computing</span>
            <span>·</span>
            <span>Spatial Computing</span>
            <span>·</span>
            <span>Innovation</span>
            <span>·</span>
          </motion.div>
        </div>

        {/* Grid Features - Recipe 8/1 Pattern */}
        <section className="px-8 py-32 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-1px bg-ink/10 border border-ink/10 rounded-3xl overflow-hidden">
            {[
              { icon: Sparkles, title: "AI Augmented", desc: "Our neural engine predicts your next move, suggesting assets and styles as you create." },
              { icon: Shield, title: "Enterprise Grade", desc: "Bank-level security for your most valuable IP. Roles, permissions, and audit logs included." },
              { icon: MousePointer2, title: "Multiplayer", desc: "The smoothest real-time collaboration experience ever built for creative tools." }
            ].map((feature, i) => (
              <div key={i} className="bg-paper p-12 hover:bg-surface transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl mb-4 font-display font-bold">{feature.title}</h3>
                <p className="text-muted leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-8 py-12 border-t border-ink/5 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2 grayscale-0">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="font-display text-lg font-bold">Escola do Construtor</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted font-bold">
          © 2026 Escola do Construtor. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
