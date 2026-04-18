import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Download, 
  Share2, 
  ArrowLeft, 
  ShieldCheck, 
  Printer,
  Loader2,
  Calendar,
  User,
  Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface CertificateViewProps {
  certificateId: string;
  onBack: () => void;
}

export function CertificateView({ certificateId, onBack }: CertificateViewProps) {
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<any>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCertificate();
  }, [certificateId]);

  async function fetchCertificate() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          id,
          issue_date,
          user_id,
          course_id,
          profiles (
            full_name
          ),
          courses (
            title
          )
        `)
        .eq('id', certificateId)
        .single();

      if (error) throw error;
      setCertData(data);
    } catch (error: any) {
      toast.error('Erro ao carregar certificado: ' + error.message);
      onBack();
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#22ff88] animate-spin" />
        <p className="text-[#64748b] font-bold uppercase tracking-widest text-[10px]">Autenticando Certificação...</p>
      </div>
    );
  }

  if (!certData) return null;

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#64748b] hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Voltar ao Console</span>
          </button>
          <h1 className="text-3xl font-black text-white">Minha <span className="text-[#22ff88]">Certificação</span></h1>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handlePrint}
            className="flex-1 md:flex-none px-6 py-3.5 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
          <button className="flex-1 md:flex-none px-6 py-3.5 bg-[#22ff88] text-black font-black rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(34,255,136,0.2)]">
            <Share2 className="w-4 h-4" />
            Compartilhar
          </button>
        </div>
      </header>

      {/* Certificate Content - Print Optimized Container */}
      <div className="print-section">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          ref={certificateRef}
          className="relative bg-[#0f1115] border-[12px] md:border-[24px] border-[#1a1c22] rounded-[2rem] md:rounded-[3rem] overflow-hidden p-8 md:p-16 lg:p-24 shadow-2xl"
        >
          {/* Ornamental Background Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-[#22ff88]/10 to-transparent opacity-30 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-[#22ff88]/5 to-transparent opacity-30 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Logo & Header */}
            <div className="flex flex-col items-center gap-4 mb-16">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-[#22ff88] rounded-2xl md:rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(34,255,136,0.3)]">
                  <Award className="w-10 h-10 md:w-12 md:h-12 text-black" />
               </div>
               <h2 className="text-[10px] md:text-xs font-black text-[#22ff88] uppercase tracking-[0.5em] mt-4">Certificado de Conclusão</h2>
            </div>

            <div className="space-y-6 md:space-y-10 max-w-3xl">
              <p className="text-[#64748b] font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Certificamos solenemente que</p>
              
              <h3 className="text-3xl md:text-6xl lg:text-7xl font-black text-white px-4">
                {certData.profiles?.full_name}
              </h3>

              <div className="w-24 h-1 bg-[#22ff88] mx-auto rounded-full" />

              <p className="text-sm md:text-base lg:text-lg text-[#94a3b8] leading-relaxed max-w-2xl mx-auto">
                Concluiu com êxito todas as etapas teóricas e técnicas do treinamento de alta performance
                <span className="text-white font-black block mt-2 text-xl md:text-3xl uppercase tracking-tighter">
                  "{certData.courses?.title}"
                </span>
              </p>
            </div>

            {/* Footer Signatures/Verification */}
            <div className="grid grid-cols-1 md:grid-cols-3 w-full mt-20 md:mt-32 gap-12 items-end opacity-80">
              <div className="space-y-2 order-2 md:order-1">
                <div className="h-[1px] w-full bg-white/10 mb-4" />
                <p className="text-white font-bold text-xs uppercase tracking-widest">Diretoria de Tecnologia</p>
                <p className="text-[10px] text-[#64748b] uppercase font-bold">Aurora Creative Studio</p>
              </div>

              <div className="flex flex-col items-center justify-center order-1 md:order-2">
                 <div className="w-16 h-16 border-2 border-dashed border-[#22ff88]/20 rounded-full flex items-center justify-center mb-2">
                    <ShieldCheck className="w-8 h-8 text-[#22ff88]/40" />
                 </div>
                 <p className="text-[8px] md:text-[9px] font-black text-[#22ff88] uppercase tracking-widest mb-1">Verificação Autêntica</p>
                 <code className="text-[9px] text-[#64748b] font-mono break-all">{certData.id}</code>
              </div>

              <div className="space-y-2 order-3 md:order-3">
                 <div className="flex items-center justify-center md:justify-end gap-2 mb-4 text-white">
                    <Calendar className="w-3.5 h-3.5 text-[#22ff88]" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {new Date(certData.issue_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                 </div>
                 <div className="h-[1px] w-full bg-white/10" />
                 <p className="text-[10px] text-[#64748b] uppercase font-bold text-center md:text-right italic">Emitido via Digital System</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SEO/Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; background: #000 !important; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
          header, button { display: none !important; }
          .rounded-[2rem], .rounded-[3rem] { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
