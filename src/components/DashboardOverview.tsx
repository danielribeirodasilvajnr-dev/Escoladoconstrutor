import { motion } from 'motion/react';
import { HeroSection } from './HeroSection';
import { CourseCard } from './CourseCard';
import { FeaturedCard } from './FeaturedCard';
import { WeeklyCard } from './WeeklyCard';

const myCourses = [
  { image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&auto=format&fit=crop", title: "Design de Microprocessadores", mentor: "Dr. David Heinemeier", progress: 65 },
  { image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&auto=format&fit=crop", title: "Estruturas Paramétricas", mentor: "Eng. Sarah Chen", progress: 20 },
  { image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=800&h=450&auto=format&fit=crop", title: "Segurança de Rede Industrial", mentor: "Marcus V. Hollis", progress: 88 }
];

const recommended = [
  { image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=800&auto=format&fit=crop", category: "Novo Masterclass", title: "Inteligência Artificial em Sistemas Embarcados" },
  { image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=800&auto=format&fit=crop", category: "Fundamentos", title: "Termodinâmica para Energias Renováveis" },
  { image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=800&auto=format&fit=crop", category: "Avançado", title: "Soberania de Dados & Criptografia Industrial" }
];

const weekly = [
  { image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=450&auto=format&fit=crop", type: "Workshop", title: "Otimização de Turbinas Eólicas em Altas Altitudes" },
  { image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&h=450&auto=format&fit=crop", type: "Entrevista", title: "Mobilidade Urbana: O Futuro dos Trens Maglev" },
  { image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=450&auto=format&fit=crop", type: "Documentário", title: "Bastidores: A Engenharia por trás da PrecisionX" },
  { image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&auto=format&fit=crop", type: "Live", title: "Telecomunicações via Starlink & Além" }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function DashboardOverview() {

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="text-5xl font-display font-bold mb-2 tracking-tighter">Project Grid</h1>
        <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Active nodes in the creative cloud</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { label: "Active Nodes", val: "12", trend: "+2", color: "text-accent" },
          { label: "GPU Clusters", val: "48", trend: "0", color: "text-ink" },
          { label: "Storage Load", val: "74%", trend: "+5.2%", color: "text-amber-500" },
          { label: "Requests/s", val: "1.2k", trend: "+148", color: "text-emerald-500" },
        ].map((stat) => (
          <div key={stat.label} className="p-6 bg-paper rounded-2xl border border-ink/5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-muted uppercase mb-4 tracking-widest">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-3xl font-display font-bold tracking-tighter", stat.color)}>{stat.val}</span>
              <span className="text-[10px] font-bold text-emerald-500">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-paper rounded-2xl border border-ink/5 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[80px_1.5fr_1fr_1fr_100px] gap-4 p-5 bg-surface/50 border-b border-ink/5">
          {["ID", "PROJECT NAME", "LEAD", "DEADLINE", "ST."].map((h) => (
            <span key={h} className="text-[10px] font-bold text-muted uppercase tracking-widest">{h}</span>
          ))}
        </div>

        {data.map((row) => (
          <motion.div 
            key={row.id}
            whileHover={{ backgroundColor: "rgba(15, 23, 42, 0.02)" }}
            className="grid grid-cols-[80px_1.5fr_1fr_1fr_100px] gap-4 p-5 items-center border-b border-ink/5 last:border-0 cursor-pointer group"
          >
            <span className="text-[10px] font-mono text-muted group-hover:text-accent font-bold transition-colors">{row.id}</span>
            <span className="text-sm font-bold font-display group-hover:translate-x-1 transition-transform">{row.name}</span>
            <div className="flex items-center gap-2">
              <img src={row.avatar} className="w-6 h-6 rounded-lg border border-ink/5 shadow-sm" alt="" referrerPolicy="no-referrer" />
              <span className="text-xs font-medium text-muted grow truncate">{row.lead}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{row.deadline}</span>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                row.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 
                row.status === 'Review' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'bg-muted'
              )} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{row.status}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
