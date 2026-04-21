import { ArrowRight } from 'lucide-react';

interface FeaturedCardProps {
  image: string;
  category: string;
  title: string;
}

export function FeaturedCard({ image, category, title }: FeaturedCardProps) {
  return (
    <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer border border-white/5">
      <img 
        src={image} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/20 to-transparent" />
      
      <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-end">
        <span className="text-[8px] md:text-[10px] font-bold text-[#22ff88] uppercase tracking-[0.2em] mb-2 md:mb-3">
          {category}
        </span>
        <h3 className="text-lg md:text-2xl font-bold text-white mb-4 md:mb-6 leading-tight group-hover:translate-x-1 transition-transform">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-[9px] md:text-[11px] font-bold text-white group-hover:text-[#22ff88] transition-colors">
          Detalhes
          <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </div>
      </div>
    </div>
  );
}
