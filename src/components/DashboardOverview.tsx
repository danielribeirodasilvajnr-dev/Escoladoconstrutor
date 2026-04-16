import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function DashboardOverview() {
  const data = [
    { id: "01", name: "SaaS Redesign", status: "Active", lead: "Alex Rivera", avatar: "https://i.pravatar.cc/150?u=alex", deadline: "Oct 24" },
    { id: "02", name: "Mobile App V2", status: "Scheduled", lead: "Sarah Chen", avatar: "https://i.pravatar.cc/150?u=sarah", deadline: "Nov 12" },
    { id: "03", name: "Brand Identity", status: "Review", lead: "Marc Hughes", avatar: "https://i.pravatar.cc/150?u=marc", deadline: "Oct 28" },
    { id: "04", name: "Marketing Site", status: "Active", lead: "Elena K.", avatar: "https://i.pravatar.cc/150?u=elena", deadline: "Oct 20" },
    { id: "05", name: "Platform Core", status: "Idle", lead: "Tom Wilson", avatar: "https://i.pravatar.cc/150?u=tom", deadline: "Dec 05" },
  ];

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
