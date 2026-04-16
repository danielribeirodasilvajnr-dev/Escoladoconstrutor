import { Search, Bell, Plus } from 'lucide-react';

interface NavbarProps {
  onNewAction?: () => void;
}

export function Navbar({ onNewAction }: NavbarProps) {
  return (
    <header className="h-20 border-b border-ink/5 flex items-center justify-between px-8 bg-paper/50 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="p-2 bg-surface rounded-lg border border-ink/5 flex items-center gap-3 w-64 group focus-within:ring-2 focus-within:ring-accent/20 transition-all">
          <Search className="w-4 h-4 text-muted" />
          <input 
            type="text" 
            placeholder="FIND NODE..." 
            className="bg-transparent border-none text-[10px] font-bold focus:outline-none w-full uppercase tracking-widest placeholder:text-muted/50"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button className="relative p-2 hover:bg-surface rounded-lg transition-colors group">
          <Bell className="w-4 h-4 text-muted group-hover:text-ink" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full ring-2 ring-paper" />
        </button>
        <button 
          onClick={onNewAction}
          className="flex items-center gap-2 px-6 py-2.5 bg-ink text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg shadow-xl shadow-ink/10 hover:translate-y-[-1px] active:translate-y-[0px] transition-all"
        >
          <Plus className="w-4 h-4" />
          New Action
        </button>
      </div>
    </header>
  );
}
