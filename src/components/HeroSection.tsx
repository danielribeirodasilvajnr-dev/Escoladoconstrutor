import { Play, Info } from 'lucide-react';

interface HeroSectionProps {
  lastWatched?: any;
  onContinue?: () => void;
  onOpenCurriculum?: () => void;
}

export function HeroSection({ lastWatched, onContinue, onOpenCurriculum }: HeroSectionProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const course = lastWatched?.course || {
    title: "Engenharia de Controle Avançado",
    description: "Aprofunde-se nos algoritmos de estabilidade e feedback para sistemas robóticos de alta precisão. Uma jornada técnica através da visão de especialistas da indústria.",
    cover_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&h=800&auto=format&fit=crop"
  };

  const lesson = lastWatched?.lesson;
  const moduleInfo = lesson?.module ? `Módulo ${String(lesson.module.order_index + 1).padStart(2, '0')}: ${lesson.module.title}` : 'Série Original';

  return (
    <section className="relative h-[280px] sm:h-[350px] md:h-[480px] w-full rounded-2xl md:rounded-3xl overflow-hidden mb-8 md:mb-12 group">
      {/* Background Image */}
      <img
        src={course.cover_url}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        alt={course.title}
        referrerPolicy="no-referrer"
      />

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f1115] via-[#0f1115]/80 md:via-[#0f1115]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <span className="px-2 md:px-3 py-1 bg-[#22ff88] text-black text-[9px] md:text-[10px] font-bold uppercase tracking-wider rounded-md shrink-0">
            {lastWatched ? 'Continuar Assistindo' : 'Série Original'}
          </span>
          <span className="text-[#64748b] text-[9px] md:text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="hidden md:block w-1 h-1 bg-[#64748b] rounded-full" />
            {moduleInfo}
          </span>
        </div>

        <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 md:mb-6 leading-[1.1] tracking-tight">
          {(course?.title || '').length > 25 ? (
            <span>{course?.title}</span>
          ) : (
            <>
              {(course?.title || '').split(' ').slice(0, 2).join(' ')} <br />
              <span className="text-[#22ff88]">{(course?.title || '').split(' ').slice(2).join(' ')}</span>
            </>
          )}
        </h1>

        <p className="text-[#94a3b8] text-xs md:text-lg mb-4 md:mb-10 leading-relaxed max-w-xl line-clamp-2 md:line-clamp-3">
          {course.description}
        </p>

        <div className="flex flex-row items-center gap-2 md:gap-4">
          <button
            onClick={onContinue}
            className="flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-4 bg-[#22ff88] text-black rounded-lg md:rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-[#22ff88]/20 group/btn shrink-0"
          >
            <Play className="w-3 h-3 md:w-5 md:h-5 fill-current group-hover/btn:scale-110 transition-transform" />
            <span className="text-[10px] md:text-sm">
              {lastWatched 
                ? (lastWatched.watched_time > 5 ? `Continuar` : 'Assistir') 
                : 'Começar Agora'}
            </span>
          </button>
          <button 
            onClick={onOpenCurriculum}
            className="flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-4 bg-white/5 text-white rounded-lg md:rounded-xl font-bold hover:bg-white/10 active:scale-95 transition-all backdrop-blur-md border border-white/10 shrink-0"
          >
            <Info className="w-3 h-3 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm">Grade</span>
          </button>
        </div>
      </div>
    </section>
  );
}
