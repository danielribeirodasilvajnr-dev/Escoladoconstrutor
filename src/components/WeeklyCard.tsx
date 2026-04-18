interface WeeklyCardProps {
  image: string;
  type: string;
  title: string;
}

export function WeeklyCard({ image, type, title }: WeeklyCardProps) {
  return (
    <div className="group cursor-pointer">
      <div className="aspect-video rounded-2xl overflow-hidden mb-4 border border-white/5">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
      </div>
      <span className="text-[8px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1 md:mb-2 block">
        {type}
      </span>
      <h3 className="text-white font-bold text-xs md:text-sm leading-snug group-hover:text-[#22ff88] transition-colors line-clamp-2">
        {title}
      </h3>
    </div>
  );
}
