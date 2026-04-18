import { Search, Bell, Settings, Menu } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps {
  userData: any;
  activeView: string;
  onViewChange: (view: string) => void;
  onToggleSidebar?: () => void;
}

export function Navbar({ userData, activeView, onViewChange, onToggleSidebar }: NavbarProps) {
  const avatarUrl = userData?.avatar_url;
  const initial = (userData?.name || userData?.email || '?').charAt(0).toUpperCase();

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-black/20 backdrop-blur-sm sticky top-0 z-40 border-b border-white/5">
      <div className="flex items-center flex-1 max-w-2xl gap-3 md:gap-4">
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-[#64748b] hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        
        <div className="w-full max-w-[180px] sm:max-w-xs md:max-w-sm lg:max-w-md bg-[#1a1c22] border border-white/5 rounded-full px-3 md:px-5 py-2 flex items-center gap-2 md:gap-3 group focus-within:border-[#22ff88]/50 transition-all">
          <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#64748b] group-focus-within:text-[#22ff88] shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none text-[10px] md:text-sm text-white focus:outline-none w-full placeholder:text-[#64748b]"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 md:gap-8 ml-2">
        <div className="hidden sm:flex items-center gap-4">
          <button className="relative text-[#64748b] hover:text-white transition-colors p-2">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#22ff88] rounded-full ring-2 ring-[#0f1115]" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-l border-white/10 pl-4 md:pl-8 py-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-tight truncate max-w-[120px]">{userData?.name || 'Carregando...'}</p>
            <p className={cn(
              "text-[10px] items-center font-bold uppercase tracking-wider font-mono",
              userData?.role === 'master' ? "text-red-400" : "text-[#22ff88]"
            )}>
              {userData?.role === 'master' ? 'MASTER' : 
               userData?.role === 'administrador' ? 'PROFESSOR' : 'ELITE'}
            </p>
          </div>
          <button 
            onClick={() => onViewChange('settings')}
            className={cn(
              "relative group transition-all active:scale-95 flex items-center justify-center shrink-0",
              activeView === 'settings' ? "ring-2 ring-[#22ff88] ring-offset-4 ring-offset-[#0f1115] rounded-xl" : ""
            )}
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-lg group-hover:border-[#22ff88]/50 transition-colors" 
                alt="Profile"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2a2d35] to-[#1a1c22] border border-white/10 shadow-lg flex items-center justify-center text-white font-bold text-lg group-hover:border-[#22ff88]/50 transition-colors">
                {initial}
              </div>
            )}
            <div className="absolute bottom-[-2px] right-[-2px] w-3 h-3 bg-[#22ff88] rounded-full border-2 border-[#1a1c22]" />
          </button>
        </div>
      </div>
    </header>
  );
}
