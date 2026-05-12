import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Loader2, 
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function SupportTicketModal({ isOpen, onClose, userId }: SupportTicketModalProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'ai-analysis' | 'success'>('form');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !description) return;

    try {
      setIsSubmitting(true);
      
      // 1. Criar o ticket no banco de dados
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          subject,
          description,
          status: 'open'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Mudar para estado de análise da IA
      setStep('ai-analysis');

      // 3. Chamar a Edge Function de Triagem
      const { error: aiError } = await supabase.functions.invoke('triage-ticket', {
        body: { 
          ticket_id: ticket.id,
          description: description
        }
      });

      if (aiError) console.error('Erro na triagem automática:', aiError);

      // 4. Finalizar com sucesso
      setStep('success');
      toast.success('Chamado aberto com sucesso!');
      
      // Limpar formulário após delay
      setTimeout(() => {
        setSubject('');
        setDescription('');
      }, 1000);

    } catch (error: any) {
      toast.error('Erro ao abrir chamado: ' + error.message);
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#1a1c22] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#22ff88]/10 blur-[80px] rounded-full pointer-events-none" />
            
            {step === 'form' && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#22ff88]/10 flex items-center justify-center border border-[#22ff88]/20">
                      <MessageSquare className="w-6 h-6 text-[#22ff88]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Novo Chamado</h3>
                      <p className="text-xs text-[#64748b]">Suporte especializado Construtor360</p>
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-[#64748b] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#64748b] ml-1">Assunto do Chamado</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Problema com certificado, Dúvida técnica..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-[#0f1115] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium placeholder:text-[#64748b]/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#64748b] ml-1">Descrição Detalhada</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Descreva seu problema com o máximo de detalhes possível para que nossa IA possa agilizar seu atendimento..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#0f1115] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium placeholder:text-[#64748b]/30 resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-3 bg-[#22ff88]/5 p-4 rounded-2xl border border-[#22ff88]/10">
                    <AlertCircle className="w-5 h-5 text-[#22ff88] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#22ff88]/80 leading-relaxed font-medium">
                      Seu chamado será analisado pela nossa Inteligência Artificial para classificação imediata de prioridade e categoria.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-[#22ff88] text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(34,255,136,0.15)] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Abrir Chamado
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {step === 'ai-analysis' && (
              <div className="py-20 flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-2 border-dashed border-[#22ff88]/30"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-[#22ff88] animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Triagem Inteligente</h3>
                  <p className="text-sm text-[#64748b] max-w-[280px]">
                    Nossa IA está analisando seu problema para direcionar ao departamento correto...
                  </p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="py-20 flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-[#22ff88]/10 flex items-center justify-center border border-[#22ff88]/20">
                  <CheckCircle2 className="w-12 h-12 text-[#22ff88]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Chamado Aberto!</h3>
                  <p className="text-sm text-[#64748b] max-w-[280px] mb-8">
                    Seu chamado foi classificado e já está na fila de atendimento.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-8 py-4 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all border border-white/10"
                  >
                    Fechar Janela
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
