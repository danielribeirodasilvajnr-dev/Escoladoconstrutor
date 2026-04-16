import { cn } from '../lib/utils';

interface CourseCardProps {
  image: string;
  title: string;
  mentor: string;
  progress: number;
}

export function CourseCard({ image, title, mentor, progress }: CourseCardProps) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 border border-white/5">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
        
        {/* Progress Overlays */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-bold text-[#22ff88] border border-white/10">
          {progress}%
        </div>
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-[#22ff88] shadow-[0_0_8px_rgba(34,255,136,0.5)] transition-all duration-1000" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
      
      <h3 className="text-white font-bold text-sm mb-1 group-hover:text-[#22ff88] transition-colors">{title}</h3>
      <p className="text-[#64748b] text-[11px] font-medium">Mentor: {mentor}</p>
    </div>
  );
}
