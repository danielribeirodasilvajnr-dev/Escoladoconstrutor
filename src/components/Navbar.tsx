import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, Menu } from 'lucide-react';
import { cn } from '../lib/utils';
import { NotificationPopover } from './NotificationPopover';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  userData: any;
  activeView: string;
  onViewChange: (view: string) => void;
  onToggleSidebar?: () => void;
}

export function Navbar({ userData, activeView, onViewChange, onToggleSidebar }: NavbarProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const avatarUrl = userData?.avatar_url;
  const initial = (userData?.name || userData?.email || '?').charAt(0).toUpperCase();

  useEffect(() => {
    if (userData?.id) {
      fetchUnreadCount();
      
      // Listen for notification changes
      const channel = supabase
        .channel('notifications-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userData.id}`
        }, () => {
          fetchUnreadCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userData?.id]);

  async function fetchUnreadCount() {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.id)
        .eq('is_read', false);

      if (!error) setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }

  return (
    <header className="h-14 md:h-20 flex items-center justify-between px-3 md:px-8 bg-black/20 backdrop-blur-sm sticky top-0 z-40 border-b border-white/5">
      <div className="flex items-center flex-1 max-w-2xl gap-2 md:gap-4">
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 text-[#64748b] hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        <div className="w-full max-w-[150px] sm:max-w-xs md:max-w-sm lg:max-w-md bg-[#1a1c22] border border-white/5 rounded-full px-3 md:px-5 py-1.5 md:py-2 flex items-center gap-2 md:gap-3 group focus-within:border-[#22ff88]/50 transition-all">
          <Search className="w-3 h-3 md:w-4 md:h-4 text-[#64748b] group-focus-within:text-[#22ff88] shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none text-[10px] md:text-sm text-white focus:outline-none w-full placeholder:text-[#334155]"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-8 ml-2">
        <div className="hidden sm:flex items-center gap-4 relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={cn(
              "relative text-[#64748b] hover:text-white transition-colors p-2",
              isNotificationsOpen && "text-white"
            )}
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#22ff88] rounded-full ring-2 ring-[#0f1115] animate-pulse" />
            )}
          </button>
          
          <NotificationPopover 
            userId={userData?.id}
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3 border-l border-white/10 pl-3 md:pl-8 py-1 md:py-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs md:text-sm font-bold text-white leading-tight truncate max-w-[100px] md:max-w-[150px]">
              {(() => {
                const name = userData?.name || '';
                const parts = name.trim().split(/\s+/);
                return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : name || '...';
              })()}
            </p>
            <p className={cn(
              "text-[8px] md:text-[10px] items-center font-bold uppercase tracking-wider font-mono",
              userData?.role === 'master' ? "text-red-400" : "text-[#22ff88]"
            )}>
              {userData?.role === 'master' ? 'MASTER' : 
               userData?.role === 'administrador' ? 'PROF.1' : 'ELITE'}
            </p>
          </div>
          <button 
            onClick={() => onViewChange('settings')}
            className={cn(
              "relative group transition-all active:scale-95 flex items-center justify-center shrink-0",
              activeView === 'settings' ? "ring-2 ring-[#22ff88] ring-offset-4 ring-offset-[#0f1115] rounded-lg md:rounded-xl" : ""
            )}
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover border border-white/10 shadow-lg group-hover:border-[#22ff88]/50 transition-colors" 
                alt="Profile"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-[#2a2d35] to-[#1a1c22] border border-white/10 shadow-lg flex items-center justify-center text-white font-bold text-base md:text-lg group-hover:border-[#22ff88]/50 transition-colors">
                {initial}
              </div>
            )}
            <div className="absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 bg-[#22ff88] rounded-full border-2 border-[#1a1c22]" />
          </button>
        </div>
      </div>
    </header>
  );
}
