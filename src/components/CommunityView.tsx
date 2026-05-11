import { motion } from 'motion/react';
import { MessageCircle, Users, Zap, ExternalLink } from 'lucide-react';

export function CommunityView() {
  const whatsappUrl = "https://chat.whatsapp.com/IzpcQajM3mDGvreqUCDnKA";

  return (
    <div className="p-6 md:p-12 min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#0a0b0e]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#1a1c22] rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-2xl"
      >
        {/* Background Glows */}
        <div className="absolute -top-24 -right-24 w-64 h-64 blur-[120px] opacity-20 bg-[#22ff88]" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[120px] opacity-10 bg-[#22ff88]" />

        <div className="relative p-8 md:p-16 text-center space-y-8">
          {/* Icon Header */}
          <div className="flex justify-center">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-[#22ff88]/10 rounded-[2rem] border border-[#22ff88]/20 flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-[#22ff88]/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <MessageCircle className="w-10 h-10 md:w-12 md:h-12 text-[#22ff88] relative z-10" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="px-3 py-1 bg-[#22ff88]/10 text-[#22ff88] text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-[#22ff88]/20">
                Acesso Exclusivo
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-none">
              Comunidade <span className="text-[#22ff88]">VIP</span>
            </h1>
            <p className="text-[#64748b] text-sm md:text-lg leading-relaxed max-w-xl mx-auto font-medium">
              Receba comunicados oficiais, novidades da plataforma, atualizações de cursos e conteúdos exclusivos diretamente no grupo VIP da Construtor360. Ambiente informativo e organizado, exclusivo para alunos.
            </p>
          </div>

          {/* Stats/Benefits */}
          <div className="grid grid-cols-3 gap-4 py-8 border-y border-white/5">
            <div className="space-y-1">
              <Users className="w-5 h-5 text-[#22ff88] mx-auto mb-2 opacity-50" />
              <p className="text-white font-bold text-xs uppercase tracking-tighter">Networking</p>
            </div>
            <div className="space-y-1 border-x border-white/5">
              <Zap className="w-5 h-5 text-[#22ff88] mx-auto mb-2 opacity-50" />
              <p className="text-white font-bold text-xs uppercase tracking-tighter">Suporte</p>
            </div>
            <div className="space-y-1">
              <ExternalLink className="w-5 h-5 text-[#22ff88] mx-auto mb-2 opacity-50" />
              <p className="text-white font-bold text-xs uppercase tracking-tighter">Parcerias</p>
            </div>
          </div>

          <div className="pt-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-16 md:h-20 bg-[#22ff88] text-black font-black text-xs md:text-sm uppercase tracking-[0.2em] rounded-2xl md:rounded-[1.5rem] flex items-center justify-center gap-3 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,255,136,0.3)] transition-all active:scale-95 group"
            >
              Entrar no Grupo WhatsApp
              <ExternalLink className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
            <p className="mt-6 text-[10px] text-[#334155] font-bold uppercase tracking-widest">
              Ambiente moderado • Exclusivo para alunos
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
