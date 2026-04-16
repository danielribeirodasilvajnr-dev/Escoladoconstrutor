import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Activity,
  Box,
  CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "projects", icon: Box, label: "Projects" },
    { id: "team", icon: Users, label: "Team / Clients" },
    { id: "analytics", icon: Activity, label: "Analytics" },
    { id: "billing", icon: CreditCard, label: "Billing" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="w-64 border-r border-ink/5 bg-paper flex flex-col shadow-[1px_0_0_0_rgba(15,23,42,0.05)] h-screen sticky top-0">
      <div className="p-8">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-4 h-4 bg-accent rounded shadow-lg shadow-accent/20" />
          <span className="font-display font-bold tracking-tight">Aurora Console</span>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-all rounded-lg text-left",
                activeView === item.id ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted hover:bg-black/5 hover:text-ink"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-ink/5">
        <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-ink/5">
          <img 
            src="https://i.pravatar.cc/150?u=me" 
            className="w-10 h-10 rounded-lg object-cover shadow-sm" 
            alt="Me"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">Daniel Ribeiro</p>
            <p className="text-[9px] font-mono text-accent uppercase font-bold tracking-widest">Admin v5.4</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
