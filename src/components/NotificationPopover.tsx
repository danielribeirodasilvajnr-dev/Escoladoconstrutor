import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCircle2, 
  MessageSquare, 
  Package, 
  Clock, 
  X, 
  ExternalLink,
  MailOpen,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'purchase' | 'comment' | 'publication' | 'activity';
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationPopoverProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPopover({ userId, isOpen, onClose }: NotificationPopoverProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error: any) {
      console.error('Erro ao marcar como lida:', error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('Todas as notificações marcadas como lidas');
    } catch (error: any) {
      toast.error('Erro ao atualizar notificações');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <Package className="w-4 h-4 text-[#22ff88]" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'publication': return <CheckCircle2 className="w-4 h-4 text-purple-400" />;
      case 'activity': return <Clock className="w-4 h-4 text-orange-400" />;
      default: return <Bell className="w-4 h-4 text-[#64748b]" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-40 md:hidden bg-black/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-4 w-[calc(100vw-32px)] md:w-96 bg-[#0f1115] border border-white/5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Notificações</h3>
                <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-tighter mt-1">
                  {notifications.filter(n => !n.is_read).length} não lidas
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={markAllAsRead}
                  className="p-2 text-[#64748b] hover:text-[#22ff88] transition-colors"
                  title="Marcar todas como lidas"
                >
                  <MailOpen className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-2 text-[#64748b] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#22ff88] animate-spin" />
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Sincronizando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-20 text-center px-8">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 opacity-20">
                    <Bell className="w-8 h-8 text-[#64748b]" />
                  </div>
                  <p className="text-sm font-bold text-white mb-1">Tudo limpo por aqui!</p>
                  <p className="text-xs text-[#64748b]">Você não tem notificações recentes.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={cn(
                        "p-5 hover:bg-white/[0.03] transition-all cursor-pointer group relative",
                        !notif.is_read && "bg-[#22ff88]/[0.02]"
                      )}
                    >
                      {!notif.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#22ff88]" />
                      )}
                      
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-[#22ff88]/20 transition-colors">
                          {getTypeIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={cn(
                              "text-xs font-bold leading-tight truncate",
                              notif.is_read ? "text-[#94a3b8]" : "text-white"
                            )}>
                              {notif.title}
                            </h4>
                            <span className="text-[9px] font-bold text-[#64748b] whitespace-nowrap ml-2">
                              {formatTime(notif.created_at)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748b] leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                          
                          {notif.link && (
                            <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black text-[#22ff88] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                              Ver Detalhes
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01] text-center">
              <button 
                onClick={onClose}
                className="text-[10px] font-black text-[#64748b] hover:text-white uppercase tracking-[0.2em] transition-colors"
              >
                Fechar Painel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
