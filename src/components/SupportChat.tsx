import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User, Sparkles, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_ai_response: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
    role: string;
  };
}

interface SupportChatProps {
  ticketId: string;
  currentUserId: string;
  isAdmin?: boolean;
}

export function SupportChat({ ticketId, currentUserId, isAdmin }: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    // Inscrição Realtime para novas mensagens
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          sender:sender_id (
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as any[] || []);
    } catch (error: any) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: currentUserId,
          content: newMessage.trim(),
          is_ai_response: false
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      toast.error('Erro ao enviar mensagem: ' + error.message);
    } finally {
      setIsSending(false);
    }
  }

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#22ff88]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-[#0f1115] rounded-[2rem] border border-white/5 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <MessageCircleIcon className="w-12 h-12 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Nenhuma mensagem ainda</p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const isAI = msg.is_ai_response;
          const isStaff = msg.sender?.role === 'master' || msg.sender?.role === 'professor';

          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex flex-col max-w-[80%]",
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5 px-1">
                {!isMe && (
                  <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                    {isAI ? (
                      <Sparkles className="w-3 h-3 text-[#22ff88]" />
                    ) : msg.sender?.avatar_url ? (
                      <img src={msg.sender.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3 h-3 text-[#64748b]" />
                    )}
                  </div>
                )}
                <span className="text-[9px] font-black uppercase tracking-widest text-[#64748b]">
                  {isAI ? 'Assistente IA' : msg.sender?.full_name || 'Usuário'}
                  {isStaff && !isAI && <span className="ml-1.5 text-[#22ff88]">● Suporte</span>}
                </span>
              </div>

              <div 
                className={cn(
                  "px-5 py-3 rounded-2xl text-sm leading-relaxed",
                  isMe 
                    ? "bg-[#22ff88] text-black font-medium rounded-tr-none" 
                    : isAI 
                      ? "bg-[#22ff88]/5 border border-[#22ff88]/20 text-white rounded-tl-none shadow-[0_0_20px_rgba(34,255,136,0.05)]"
                      : "bg-white/5 border border-white/5 text-zinc-300 rounded-tl-none"
                )}
              >
                {msg.content}
              </div>
              <span className="mt-1 text-[8px] text-[#64748b] px-1 font-medium">
                {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-[#1a1c22] border-t border-white/5">
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            placeholder="Digite sua resposta..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-[#0f1115] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium placeholder:text-[#64748b]/30"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="w-12 h-12 bg-[#22ff88] text-black rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_5px_15px_rgba(34,255,136,0.1)] shrink-0"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

function MessageCircleIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
