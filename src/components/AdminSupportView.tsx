import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User,
  Shield,
  Loader2,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SupportChat } from './SupportChat';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  sentiment: string;
  ai_confidence_score: number;
  created_at: string;
  user_id: string;
  user: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function AdminSupportView({ userData }: { userData: any }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function handleAssignTicket() {
    if (!selectedTicket || !userData) return;

    try {
      setIsAssigning(true);
      const { error } = await supabase
        .from('support_tickets')
        .update({
          assigned_to: userData.id,
          status: 'in_progress'
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast.success('Você assumiu este chamado!');
      setSelectedTicket(prev => prev ? { ...prev, status: 'in_progress' } : null);
      fetchTickets(); // Atualiza a lista ao fundo
    } catch (error: any) {
      toast.error('Erro ao assumir chamado: ' + error.message);
    } finally {
      setIsAssigning(false);
    }
  }

  async function fetchTickets() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          user:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data as any[] || []);
    } catch (error: any) {
      toast.error('Erro ao buscar chamados: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return { label: 'Aberto', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'in_progress':
        return { label: 'Em Atendimento', color: 'bg-[#22ff88]/10 text-[#22ff88] border-[#22ff88]/20' };
      case 'resolved':
        return { label: 'Resolvido', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      default:
        return { label: 'Fechado', color: 'bg-white/5 text-[#64748b] border-white/10' };
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    const labels: Record<string, string> = {
      'calm': 'Calmo',
      'confused': 'Confuso',
      'irritated': 'Irritado',
      'frustrated': 'Frustrado'
    };
    return labels[sentiment] || sentiment;
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'irritated': return '😠';
      case 'frustrated': return '😫';
      case 'confused': return '🤔';
      default: return '😊';
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-4 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-20">
      <header>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">Gestão de Chamados</h1>
        </div>
        <p className="text-[#64748b] text-sm md:text-base font-medium tracking-wide uppercase">Auditoria e triagem centralizada de suporte</p>
      </header>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-5 items-center justify-between bg-[#1a1c22] p-4 rounded-3xl border border-white/5">
        <div className="relative group w-full lg:max-w-md">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] group-focus-within:text-[#22ff88] transition-colors" />
          <input
            type="text"
            placeholder="Buscar por assunto ou aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0f1115] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium placeholder:text-[#64748b]/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 lg:flex-none bg-[#0f1115] border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-[#22ff88]/30 appearance-none min-w-[140px]"
          >
            <option value="all">TODOS STATUS</option>
            <option value="open">ABERTOS</option>
            <option value="in_progress">EM ATENDIMENTO</option>
            <option value="resolved">RESOLVIDOS</option>
          </select>

          <select 
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="flex-1 lg:flex-none bg-[#0f1115] border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-[#22ff88]/30 appearance-none min-w-[140px]"
          >
            <option value="all">TODAS PRIORIDADES</option>
            <option value="low">BAIXA</option>
            <option value="medium">MÉDIA</option>
            <option value="high">ALTA</option>
            <option value="critical">CRÍTICA</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Tickets List */}
        <div className="lg:col-span-12">
          <div className="bg-[#1a1c22] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-[#64748b] space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#22ff88]" />
                <p className="text-sm font-medium tracking-widest uppercase">Buscando chamados da rede...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center px-6">
                <Inbox className="w-16 h-16 text-[#64748b] mb-6 opacity-20" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhum chamado pendente</h3>
                <p className="text-[#64748b] max-w-xs text-sm leading-relaxed">
                  Todos os alunos estão sendo atendidos no momento ou nenhum chamado corresponde aos filtros.
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
                      className={`group p-6 md:p-8 hover:bg-white/[0.02] transition-all cursor-pointer border-l-4 ${
                        ticket.priority === 'critical' ? 'border-red-500' : 'border-transparent'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-6 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-[#0f1115] border border-white/5 flex items-center justify-center overflow-hidden shrink-0 mt-1">
                            {ticket.user?.avatar_url ? (
                              <img src={ticket.user.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-[#64748b]" />
                            )}
                          </div>
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${status.color}`}>
                                {status.label}
                              </span>
                              <span className="text-[10px] text-[#64748b] font-mono">#{ticket.id.slice(0, 8)}</span>
                              <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                                <span className="text-xs">{getSentimentEmoji(ticket.sentiment)}</span>
                                <span className="text-[9px] font-black uppercase text-[#64748b] tracking-widest">
                                  {getSentimentLabel(ticket.sentiment) || 'Analisando...'}
                                </span>
                              </div>
                            </div>
                            <h4 className="text-lg font-bold text-white group-hover:text-[#22ff88] transition-colors truncate">
                              {ticket.subject}
                            </h4>
                            <div className="flex items-center gap-4 text-xs text-[#64748b]">
                              <span className="font-bold text-white/60">{ticket.user?.full_name}</span>
                              <span>•</span>
                              <span className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-[#22ff88]" />
                                IA: {ticket.category || 'Pendente'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-1">Aberta em</p>
                            <p className="text-xs text-white font-medium">
                              {new Date(ticket.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#64748b] group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Details Drawer/Modal would go here */}
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
                  <XIcon className="w-4 h-4" /> Fechar Painel
                </button>
                <div className="flex gap-3">
                   {selectedTicket.status === 'open' && (
                     <button 
                       onClick={handleAssignTicket}
                       disabled={isAssigning}
                       className="px-6 py-3 bg-[#22ff88] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                     >
                       {isAssigning ? 'Processando...' : 'Assumir Chamado'}
                     </button>
                   )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-10 pr-4">
                <header className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest ${getStatusBadge(selectedTicket.status).color}`}>
                      {getStatusBadge(selectedTicket.status).label}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      selectedTicket.priority === 'critical' ? 'text-red-400' : 'text-[#64748b]'
                    }`}>
                      Prioridade: {selectedTicket.priority}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white leading-tight">{selectedTicket.subject}</h2>
                </header>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">Aluno</p>
                    <p className="text-sm text-white font-bold">{selectedTicket.user.full_name}</p>
                    <p className="text-xs text-[#64748b]">{selectedTicket.user.email}</p>
                  </div>
                  <div className="bg-[#22ff88]/5 p-4 rounded-2xl border border-[#22ff88]/10">
                    <p className="text-[10px] font-bold text-[#22ff88] uppercase tracking-widest mb-2">Analise da IA</p>
                    <p className="text-sm text-white font-bold">{selectedTicket.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs">{getSentimentEmoji(selectedTicket.sentiment)}</span>
                      <span className="text-xs text-[#22ff88]/70 font-medium">Sentimento: {getSentimentLabel(selectedTicket.sentiment)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Relato do Aluno</p>
                   <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                      <p className="text-zinc-300 leading-relaxed">{selectedTicket.description}</p>
                   </div>
                </div>

                <div className="pt-6">
                   <SupportChat 
                     ticketId={selectedTicket.id} 
                     currentUserId={userData.id} 
                     isAdmin={true} 
                   />
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
