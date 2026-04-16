import { Play, Info } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative h-[480px] w-full rounded-3xl overflow-hidden mb-12 group">
      {/* Background Image */}
      <img 
        src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&h=800&auto=format&fit=crop" 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        alt="Hero Background"
        referrerPolicy="no-referrer"
      />
      
      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f1115] via-[#0f1115]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1 bg-[#22ff88] text-black text-[10px] font-bold uppercase tracking-wider rounded-md">
            Série Original
          </span>
          <span className="text-[#64748b] text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-1 bg-[#64748b] rounded-full" />
            Módulo 04: Sistemas Autônomos
          </span>
        </div>

        <h1 className="text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
          Engenharia de <br />
          <span className="text-[#22ff88]">Controle Avançado</span>
        </h1>

        <p className="text-[#94a3b8] text-lg mb-10 leading-relaxed max-w-xl">
          Aprofunde-se nos algoritmos de estabilidade e feedback para sistemas robóticos de alta precisão. 
          Uma jornada técnica através da visão de especialistas da indústria.
        </p>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-3 px-8 py-4 bg-[#22ff88] text-black rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-[#22ff88]/20">
            <Play className="w-5 h-5 fill-current" />
            Continuar de 24:15
          </button>
          <button className="flex items-center gap-3 px-8 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 active:scale-95 transition-all backdrop-blur-md border border-white/10">
            <Info className="w-5 h-5" />
            Ver Grade Curricular
          </button>
        </div>
      </div>
    </section>
  );
}
