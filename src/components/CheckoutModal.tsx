import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, ShieldCheck, CheckCircle2, Loader2, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface CheckoutModalProps {
  course: any;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ course, userId, onClose, onSuccess }: CheckoutModalProps) {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  const isFree = Number(course.price) === 0;

  const handlePayment = async () => {
    setLoading(true);
    setStep('processing');

    try {
      if (isFree) {
        // Immediate enrollment for free courses
        const { error } = await supabase
          .rpc('enroll_free_course', {
            p_course_id: course.id
          });

        if (error && error.code !== '23505') throw error;
        
        // Notify Student
        const { error: studentNotifError } = await supabase.from('notifications').insert({
          user_id: userId,
          type: 'purchase',
          title: 'Inscrição Confirmada!',
          message: `Você agora tem acesso vitalício ao curso "${course.title}".`,
          link: `/dashboard?course=${course.id}`
        });

        if (studentNotifError) {
          console.error('Erro ao notificar aluno:', studentNotifError);
        }

        // Notify Instructor
        if (course.instructor_id) {
          const { error: instructorNotifError } = await supabase.from('notifications').insert({
            user_id: course.instructor_id,
            type: 'sale',
            title: 'Novo aluno matriculado!',
            message: `Um novo aluno acabou de se inscrever no seu curso "${course.title}".`,
            link: `/dashboard/courses`
          });

          if (instructorNotifError) {
            console.error('Erro ao notificar instrutor:', instructorNotifError);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStep('success');
      } else {
        // Minimum Amount validation (R$ 1,00 in Mercado Pago for some operations, but we can bypass this or leave 0.50 if fine)
        if (Number(course.price) < 0.50) {
          throw new Error('O valor mínimo para pagamentos é R$ 0,50. Por favor, ajuste o valor do curso ou mude para R$ 0,00.');
        }

        // Mercado Pago Checkout Integration
        const { data, error } = await supabase.functions.invoke('create-mp-preference', {
          body: { courseId: course.id }
        });

        if (error) {
          let detail = 'Erro no servidor de pagamento do Mercado Pago.';
          try {
            const body = await error.context.json();
            detail = body.error || body.message || detail;
          } catch {
            detail = error.message || detail;
          }
          throw new Error(detail);
        }

        if (data?.url) {
          // Redirect the user to the Mercado Pago checkout
          window.location.href = data.url;
        } else {
          throw new Error('Não foi possível gerar link do Mercado Pago.');
        }
      }
    } catch (error: any) {
      toast.error('Ocorreu um problema: ' + (error.message || 'Verifique sua conexão.'));
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-[#0f1115] rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-2xl"
      >
        {step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors z-10"
          >
            <X className="w-5 h-5 text-[#64748b]" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-12"
            >
              <div className="flex gap-8 mb-10">
                <div className="w-48 aspect-video rounded-2xl overflow-hidden shrink-0 border border-white/5 bg-[#0f1115]">
                  <img src={course.cover_url} className="w-full h-full object-cover object-center" alt={course.title} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2 text-[#22ff88]">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Acesso Vitalício</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{course.title}</h3>
                  <p className="text-sm text-[#64748b] line-clamp-2">{course.description}</p>
                </div>
              </div>

              <div className="space-y-6 mb-12">
                <div className="flex justify-between items-center py-4 border-b border-white/5">
                  <span className="text-white font-medium">Preço da Inscrição</span>
                  <span className="text-xl font-bold text-white">
                    {isFree ? 'GRATUITO' : `R$ ${course.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                {!isFree && (
                  <div className="flex justify-between items-center py-4 border-b border-white/5">
                    <span className="text-white font-medium">Parcelamento</span>
                    <span className="text-[#22ff88] font-bold text-sm tracking-widest uppercase">Até 12x no Cartão</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4">
                  <span className="text-lg font-bold text-white">Total</span>
                  <span className="text-3xl font-bold text-[#22ff88]">
                    {isFree ? 'R$ 0,00' : `R$ ${course.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>

              <div className="bg-[#1a1c22] p-6 rounded-2xl border border-white/5 mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#22ff88]/10 rounded-xl flex items-center justify-center border border-[#22ff88]/20">
                  <CreditCard className="w-6 h-6 text-[#22ff88]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">
                    {isFree ? 'Liberação Imediata' : 'Pagamento Seguro'}
                  </p>
                  <p className="text-[11px] text-[#64748b]">
                    {isFree ? 'Você terá acesso total à Masterclass instantaneamente.' : 'Processado com segurança via Mercado Pago (Cartão ou Pix).'}
                  </p>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-5 bg-[#22ff88] text-black font-extrabold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3 group shadow-[0_0_30px_rgba(34,255,136,0.2)]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    {isFree ? 'INICIAR ACESSO GRÁTIS' : 'PAGAR E INICIAR AGORA'}
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </motion.div>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-20 text-center"
            >
              <Loader2 className="w-20 h-20 text-[#22ff88] animate-spin mx-auto mb-8" />
              <h3 className="text-2xl font-bold text-white mb-4">Processando Inscrição...</h3>
              <p className="text-[#64748b]">Sincronizando dados com o 360Pro.</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-20 text-center"
            >
              <div className="w-24 h-24 bg-[#22ff88]/10 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-[#22ff88]/20 shadow-[0_0_50px_rgba(34,255,136,0.1)]">
                <CheckCircle2 className="w-12 h-12 text-[#22ff88]" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-4">Acesso Liberado!</h3>
              <p className="text-[#64748b] text-lg mb-12 max-w-sm mx-auto">
                Parabéns! O curso <strong>{course.title}</strong> já está disponível no seu console.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-12">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <Award className="w-6 h-6 text-[#22ff88] mx-auto mb-2" />
                  <p className="text-[10px] uppercase font-bold text-white/40">Certificação</p>
                  <p className="text-xs font-bold text-white">Inclusa</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <ShieldCheck className="w-6 h-6 text-[#22ff88] mx-auto mb-2" />
                  <p className="text-[10px] uppercase font-bold text-white/40">Acesso</p>
                  <p className="text-xs font-bold text-white">Vitalício</p>
                </div>
              </div>

              <button
                onClick={onSuccess}
                className="px-12 py-5 bg-white text-black font-extrabold rounded-2xl hover:bg-white/90 transition-all uppercase tracking-widest text-sm"
              >
                Ir para Meus Cursos
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
