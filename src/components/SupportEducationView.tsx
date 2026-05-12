import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SupportTicketModal } from './SupportTicketModal';
import { SupportChat } from './SupportChat';
import { motion, AnimatePresence } from 'motion/react';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'pending_student' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sentiment: string;
  created_at: string;
}

export function SupportEducationView({ userData }: { userData: any }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return { label: 'Aberto', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock };
      case 'in_progress':
        return { label: 'Em Atendimento', color: 'bg-[#22ff88]/10 text-[#22ff88] border-[#22ff88]/20', icon: MessageCircle };
      case 'resolved':
        return { label: 'Resolvido', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 };
      default:
        return { label: 'Fechado', color: 'bg-white/5 text-[#64748b] border-white/10', icon: CheckCircle2 };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-blue-400';
      default:
        return 'text-[#64748b]';
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 max-w-[1400px] mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#22ff88]/10 flex items-center justify-center border border-[#22ff88]/20">
              <BookOpen className="w-4 h-4 text-[#22ff88]" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">Suporte Educação</h1>
          </div>
          <p className="text-[#64748b] text-sm md:text-base font-medium">Central de triagem inteligente e suporte acadêmico</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-[#22ff88] text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(34,255,136,0.15)]"
        >
          <Plus className="w-4 h-4" />
          Novo Chamado
        </button>
      </header>

      {/* Stats and Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] group-focus-within:text-[#22ff88] transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar em seus chamados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1c22] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium placeholder:text-[#64748b]/30"
          />
        </div>
        <div className="md:col-span-4 bg-[#1a1c22] border border-white/5 rounded-2xl p-4 flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-widest mb-1">Total</p>
            <p className="text-xl font-black text-white">{tickets.length}</p>
          </div>
          <div className="w-[1px] h-8 bg-white/5" />
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-widest mb-1">Em Aberto</p>
            <p className="text-xl font-black text-[#22ff88]">
              {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
            </p>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-[#1a1c22] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#64748b] space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#22ff88]" />
            <p className="text-sm font-medium">Carregando seus chamados...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10 opacity-20">
              <MessageCircle className="w-10 h-10 text-[#64748b]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tudo em dia por aqui!</h3>
            <p className="text-[#64748b] max-w-xs text-sm leading-relaxed">
              Você ainda não abriu nenhum chamado de suporte. Se precisar de ajuda, clique no botão acima.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredTickets.map((ticket) => {
              const status = getStatusBadge(ticket.status);
              return (
                <div 
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="group p-6 md:p-8 hover:bg-white/[0.02] transition-all cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest ${status.color} flex items-center gap-1.5`}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </span>
                        {ticket.priority === 'critical' && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-red-400 uppercase tracking-widest animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            Crítico
                          </span>
                        )}
                        <span className="text-[10px] text-[#64748b] font-medium">
                          ID: #{ticket.id.slice(0, 6).toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-white group-hover:text-[#22ff88] transition-colors">
                        {ticket.subject}
                      </h4>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-[#22ff88]" />
                          <span className="text-xs text-[#64748b] font-medium">
                            IA: <span className="text-white">{ticket.category || 'Classificando...'}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#64748b]" />
                          <span className="text-xs text-[#64748b] font-medium">
                            {new Date(ticket.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:block h-10 w-[1px] bg-white/5" />
                      <button className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#22ff88] hover:text-black transition-all">
                        Ver Detalhes
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SupportTicketModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchTickets();
        }}
        userId={userData.id}
      />

      {/* Ticket Details for Student */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[60] flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-2xl h-full bg-[#0f1115] border-l border-white/5 p-8 md:p-12 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase text-[#64748b] hover:text-white transition-colors"
                >
                  <XIcon className="w-4 h-4" /> Voltar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-10 pr-4 custom-scrollbar">
                <header className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest ${getStatusBadge(selectedTicket.status).color}`}>
                      {getStatusBadge(selectedTicket.status).label}
                    </span>
                    <span className="text-[10px] font-black uppercase text-[#64748b] tracking-widest">
                      Protocolo: #{selectedTicket.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white leading-tight">{selectedTicket.subject}</h2>
                </header>

                <div className="space-y-4">
                   <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Seu Relato</p>
                   <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                      <p className="text-zinc-300 leading-relaxed text-sm">{selectedTicket.description}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-bold text-[#22ff88] uppercase tracking-widest flex items-center gap-2">
                     <MessageCircle className="w-3.5 h-3.5" /> Chat de Suporte
                   </p>
                   <div className="h-[450px]">
                     <SupportChat 
                       ticketId={selectedTicket.id} 
                       currentUserId={userData.id} 
                     />
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function XIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

