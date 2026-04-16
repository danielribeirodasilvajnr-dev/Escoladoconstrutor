import { Search, Bell, Settings } from 'lucide-react';

export function Navbar() {
  return (
    <header className="h-20 flex items-center justify-between px-8 bg-black/20 backdrop-blur-sm sticky top-0 z-40 border-b border-white/5">
      <div className="flex items-center flex-1 max-w-2xl px-4">
        <div className="w-full bg-[#1a1c22] border border-white/5 rounded-full px-5 py-2.5 flex items-center gap-3 group focus-within:border-[#22ff88]/50 transition-all">
          <Search className="w-4 h-4 text-[#64748b] group-focus-within:text-[#22ff88]" />
          <input 
            type="text" 
            placeholder="Buscar cursos, trilhas ou mentores..." 
            className="bg-transparent border-none text-sm text-white focus:outline-none w-full placeholder:text-[#64748b]"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <button className="relative text-[#64748b] hover:text-white transition-colors p-2">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#22ff88] rounded-full ring-2 ring-[#0f1115]" />
          </button>
          <button className="text-[#64748b] hover:text-white transition-colors p-2">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-l border-white/10 pl-8 py-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-tight">Arthur Morgan</p>
            <p className="text-[10px] items-center text-[#22ff88] font-bold uppercase tracking-wider font-mono">
              Senior Engineer
            </p>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&auto=format&fit=crop" 
              className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-lg" 
              alt="Profile"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-[-2px] right-[-2px] w-3 h-3 bg-[#22ff88] rounded-full border-2 border-[#1a1c22]" />
          </div>
        </div>
      </div>
    </header>
  );
}
