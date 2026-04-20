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
  Zap
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
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCertificate();
  }, [certificateId]);

  async function fetchCertificate() {
    try {
      setLoading(true);
      // 1. Fetch Basic Certificate Data
      const { data: cert, error: certError } = await supabase
        .from('certificates')
        .select(`
          id,
          issue_date,
          user_id,
          course_id,
          profiles ( full_name ),
          courses ( 
            title,
            instructor_id,
            instructor:profiles!instructor_id ( full_name )
          )
        `)
        .eq('id', certificateId)
        .single();

      if (certError) throw certError;
      setCertData(cert);

      // 2. Fetch Curriculum for the Course
      const { data: modules, error: modError } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          order_index,
          lessons (
            id,
            title,
            duration,
            order_index
          )
        `)
        .eq('course_id', cert.course_id)
        .order('order_index');

      if (modError) throw modError;
      
      const sortedCurriculum = (modules || []).map(m => ({
        ...m,
        lessons: (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      setCurriculum(sortedCurriculum);
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

  const calculateTotalTime = () => {
    let totalSeconds = 0;
    curriculum.forEach(m => {
      m.lessons.forEach((l: any) => {
        const [mins, secs] = (l.duration || '00:00').split(':').map(Number);
        totalSeconds += (mins || 0) * 60 + (secs || 0);
      });
    });
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
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

  const totalDurationStr = calculateTotalTime();

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto pb-20 no-print-bg">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 print:hidden">
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
            Imprimir / PDF (A4 Paisagem)
          </button>
          <button className="flex-1 md:flex-none px-6 py-3.5 bg-[#22ff88] text-black font-black rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(34,255,136,0.2)]">
            <Share2 className="w-4 h-4" />
            Compartilhar
          </button>
        </div>
      </header>

      {/* Certificate Container */}
      <div className="print-section flex flex-col items-center gap-10">
        
        {/* PAGE 1: FRONT */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="certificate-a4 front flex flex-col bg-white text-black relative shadow-2xl overflow-hidden"
        >
          {/* Top Bar Branding */}
          <div className="p-10 md:p-16 flex justify-between items-start">
             <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-black flex items-center gap-2">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-black rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 md:w-6 md:h-6 text-[#22ff88]" />
                   </div>
                   CONSTRUTOR<span className="text-[#22ff88]">360</span>
                </h2>
             </div>
             <div className="text-right flex flex-col items-end gap-1 opacity-20">
                <p className="text-[7px] md:text-[9px] font-mono leading-none tracking-tighter">CERTIFICADO AUTÊNTICO</p>
                <p className="text-[7px] md:text-[9px] font-mono leading-none tracking-tighter">{certData.id}</p>
             </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col px-10 md:px-24 pt-4">
             <div className="space-y-2 mb-12">
                <p className="text-[10px] md:text-sm font-bold text-zinc-400 uppercase tracking-[0.4em]">Certificado de Conclusão</p>
                <h3 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight max-w-[90%]">
                   {certData.courses?.title}
                </h3>
             </div>

             <div className="mb-12">
                <p className="text-sm md:text-base text-zinc-500 mb-1 font-medium italic">Parabenizamos o aluno</p>
                <h4 className="text-4xl md:text-6xl font-black tracking-tight border-b-4 border-black inline-block pb-1">
                   {certData.profiles?.full_name}
                </h4>
             </div>

             <div className="mt-auto pb-16 grid grid-cols-2 md:grid-cols-3 gap-12 items-end">
                <div>
                   <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Instrutor Responsável</p>
                   <p className="text-sm md:text-base font-bold">{certData.courses?.instructor?.full_name}</p>
                </div>
                
                <div className="text-center md:text-left">
                   <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Carga Horária</p>
                   <p className="text-sm md:text-base font-bold">{totalDurationStr} de conteúdo</p>
                </div>

                <div className="text-right">
                   <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Emissão</p>
                   <p className="text-sm md:text-base font-bold">
                      {new Date(certData.issue_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                   </p>
                </div>
             </div>
          </div>
        </motion.div>

        {/* PAGE 2: BACK (CURRICULUM) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="certificate-a4 back flex flex-col bg-white text-black relative shadow-2xl overflow-hidden p-10 md:p-16"
        >
          <div className="flex justify-between items-center mb-10 border-b-4 border-[#22ff88] pb-6">
             <div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Conteúdo Programático</h2>
                <p className="text-[#64748b] font-bold text-[9px] md:text-[10px] uppercase tracking-widest mt-1">Detalhamento técnico da grade curricular</p>
             </div>
             <div className="text-right px-6 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Carga Horária Total</p>
                <p className="text-3xl font-black text-black">{totalDurationStr}</p>
             </div>
          </div>

          <div className="flex-1 border-2 border-zinc-200 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-x-2 divide-zinc-200 bg-zinc-50/30">
             {curriculum.map((module, mIdx) => {
               const chunkedLessons = [];
               const lessonsPerCol = Math.ceil(module.lessons.length / (module.lessons.length > 10 ? 2 : 1));
               
               return (
                 <div key={module.id} className="p-6 space-y-4 border-b border-zinc-100 last:border-0 md:border-b-0">
                    <div className="flex items-start gap-2">
                       <span className="text-[11px] font-black text-[#22ff88] mt-0.5">#{mIdx + 1}</span>
                       <h4 className="text-[11px] font-black uppercase tracking-tight leading-tight">{module.title}</h4>
                    </div>
                    <div className="space-y-1.5 pl-6 border-l border-zinc-200">
                       {module.lessons.map((lesson: any) => (
                         <div key={lesson.id} className="flex justify-between items-center text-[9px] text-[#64748b] font-medium leading-none py-0.5 group">
                            <span className="truncate pr-4 leading-tight italic">{lesson.title}</span>
                            <span className="font-mono text-[8px] whitespace-nowrap opacity-50">{lesson.duration || '--:--'}</span>
                         </div>
                       ))}
                    </div>
                 </div>
               );
             })}
          </div>

          <div className="mt-10 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#22ff88]/10 flex items-center justify-center border border-[#22ff88]/20">
                   <ShieldCheck className="w-5 h-5 text-[#22ff88]" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-black uppercase tracking-widest leading-none">Autenticidade Garantida</p>
                   <p className="text-[8px] text-zinc-400 mt-1">Este documento é original e validado por Construtor360 Academy</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[8px] font-mono text-zinc-300">ID: {certData.id}</p>
             </div>
          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --cert-width: 297mm;
          --cert-height: 210mm;
        }

        .certificate-a4 {
          width: var(--cert-width);
          min-width: var(--cert-width);
          height: var(--cert-height);
          min-height: var(--cert-height);
        }

        @media (max-width: 297mm) {
          .certificate-a4 {
            transform: scale(calc(100vw / 320mm));
            transform-origin: top center;
            margin-bottom: calc(-1 * (var(--cert-height) - (var(--cert-height) * (100vw / 320mm))));
          }
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
          }
          .no-print-bg {
            background: white !important;
            padding: 0 !important;
            max-width: none !important;
          }
          .certificate-a4 {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always;
            transform: none !important;
          }
          .front { page-break-after: always; }
          .back { page-break-before: always; }
          .print-section { display: block !important; gap: 0 !important; }
          header, .print-hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
