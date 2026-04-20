import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Search, 
  Calendar, 
  ExternalLink,
  Loader2,
  FileText,
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface CertificatesTabProps {
  userData: any;
  onViewCertificate: (id: string) => void;
}

export function CertificatesTab({ userData, onViewCertificate }: CertificatesTabProps) {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCertificates();
  }, [userData]);

  async function fetchCertificates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          id,
          issue_date,
          course_id,
          courses (
            title,
            cover_url,
            is_published
          )
        `)
        .eq('user_id', userData.id)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar certificados: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredCertificates = certificates.filter(cert => 
    cert.courses?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-[#22ff88] animate-spin" />
          <Award className="w-6 h-6 text-[#22ff88] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-[#64748b] font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Sincronizando Diplomas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-[#22ff88]" />
            <h2 className="text-[10px] font-black text-[#22ff88] uppercase tracking-[0.2em]">Meus Registros</h2>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
            Central de <span className="text-[#22ff88]">Certificados</span>
          </h1>
          <p className="text-[#64748b] text-sm md:text-base leading-relaxed">
            Gerencie suas conquistas acadêmicas, visualize seus diplomas e compartilhe sua evolução profissional.
          </p>
        </div>

        <div className="w-full md:w-auto relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] group-focus-within:text-[#22ff88] transition-colors" />
          <input
            type="text"
            placeholder="Buscar por curso..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-[#1a1c22] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white text-sm focus:outline-none focus:border-[#22ff88]/30 transition-all shadow-xl"
          />
        </div>
      </header>

      {filteredCertificates.length === 0 ? (
        <div className="bg-[#1a1c22] border border-dashed border-white/10 rounded-[2.5rem] p-20 text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-2">
            <AlertCircle className="w-10 h-10 text-[#64748b]" />
          </div>
          <h3 className="text-xl font-bold text-white">Nenhum certificado encontrado</h3>
          <p className="text-[#64748b] max-w-sm mx-auto">
            {searchQuery 
              ? "Não encontramos certificados para este termo de busca." 
              : "Conclua as avaliações finais dos seus cursos para desbloquear seus certificados oficiais."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#1a1c22] border border-white/5 rounded-[2.5rem] p-1 group hover:border-[#22ff88]/30 transition-all duration-500 overflow-hidden"
            >
              <div className="p-7 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-20 h-20 rounded-3xl bg-[#0f1115] border border-white/10 flex items-center justify-center group-hover:border-[#22ff88]/20 transition-all shadow-inner overflow-hidden relative">
                    {cert.courses?.cover_url ? (
                      <img src={cert.courses.cover_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                    ) : (
                      <Award className="w-8 h-8 text-[#22ff88]/50" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] to-transparent opacity-60" />
                  </div>
                  <div className="px-3 py-1.5 bg-[#22ff88]/10 rounded-lg border border-[#22ff88]/10 text-[#22ff88] text-[8px] font-black uppercase tracking-widest">
                    Original
                  </div>
                </div>

                <div>
                   <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 md:h-14">
                      {cert.courses?.title}
                   </h3>
                   <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#64748b] font-bold">
                         <Calendar className="w-3.5 h-3.5" />
                         {new Date(cert.issue_date).toLocaleDateString()}
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                      <div className="flex items-center gap-1.5 text-[10px] text-[#64748b] font-bold uppercase tracking-wider">
                         <ShieldCheck className="w-3.5 h-3.5 text-[#22ff88]" />
                         Autêntico
                      </div>
                   </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => onViewCertificate(cert.id)}
                    className="w-full py-4 bg-[#22ff88]/5 text-[#22ff88] font-black rounded-2xl flex items-center justify-center gap-2 group-hover:bg-[#22ff88] group-hover:text-black transition-all duration-300 text-[10px] uppercase tracking-widest border border-[#22ff88]/10 group-hover:border-transparent group-hover:shadow-[0_0_30px_rgba(34,255,136,0.15)]"
                  >
                    <Download className="w-4 h-4" />
                    Ver e Baixar
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Verification Footer */}
      <footer className="mt-12 bg-black/20 p-8 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-[#22ff88]/10 rounded-2xl flex items-center justify-center border border-[#22ff88]/20">
              <ShieldCheck className="w-6 h-6 text-[#22ff88]" />
           </div>
           <div>
              <p className="text-white font-bold text-sm">Autenticidade Garantida</p>
              <p className="text-xs text-[#64748b]">Nossos certificados possuem um identificador único de validade técnica.</p>
           </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest mb-1">Total de Conquistas</p>
           <p className="text-3xl font-black text-white">{certificates.length}</p>
        </div>
      </footer>
    </div>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
