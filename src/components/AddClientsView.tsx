import { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Mail, Globe, Phone, Camera, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export function AddClientsView() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-20 mt-4 md:mt-0">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 md:mb-12"
      >
        <h1 className="text-3xl md:text-5xl font-display font-bold mb-2 tracking-tighter text-white">Novo Cliente</h1>
        <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.2em]">Registre um novo parceiro criativo na nuvem</p>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8 md:gap-12 items-start">
        {/* Form Section */}
        <div className="space-y-6 md:space-y-8 bg-[#1a1c22] p-6 md:p-10 rounded-2xl md:rounded-3xl border border-white/5 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-2">
              <label className="text-[9px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Ex: João Silva"
                  className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm font-medium text-white focus:outline-none focus:border-[#22ff88]/30 transition-all placeholder:text-[#64748b]/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b]/40 group-focus-within:text-[#22ff88] transition-colors" />
                <input 
                  type="email" 
                  placeholder="exemplo@empresa.com"
                  className="w-full bg-[#0f1115] border border-white/5 rounded-xl pl-10 md:pl-12 pr-4 md:pr-5 py-3 md:py-4 text-xs md:text-sm font-medium text-white focus:outline-none focus:border-[#22ff88]/30 transition-all placeholder:text-[#64748b]/40"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-2">
              <label className="text-[9px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Website</label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b]/40 group-focus-within:text-[#22ff88] transition-colors" />
                <input 
                  type="text" 
                  placeholder="https://..."
                  className="w-full bg-[#0f1115] border border-white/5 rounded-xl pl-10 md:pl-12 pr-4 md:pr-5 py-3 md:py-4 text-xs md:text-sm font-medium text-white focus:outline-none focus:border-[#22ff88]/30 transition-all placeholder:text-[#64748b]/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">Telefone</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b]/40 group-focus-within:text-[#22ff88] transition-colors" />
                <input 
                  type="tel" 
                  placeholder="(00) 00000-0000"
                  className="w-full bg-[#0f1115] border border-white/5 rounded-xl pl-10 md:pl-12 pr-4 md:pr-5 py-3 md:py-4 text-xs md:text-sm font-medium text-white focus:outline-none focus:border-[#22ff88]/30 transition-all placeholder:text-[#64748b]/40"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10 hover:bg-[#22ff88] hover:text-black hover:border-transparent active:scale-95 transition-all">
              Inicializar Conta
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Avatar / Sidebar Section */}
        <div className="space-y-6 md:space-y-8">
          {/* Correction Header/Avatar: Explicit padding and relative container to ensure visibility */}
          <div className="relative pt-2"> 
            <label className="text-[9px] md:text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1 mb-4 block">Avatar do Cliente</label>
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              className={cn(
                "aspect-square rounded-2xl md:rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all overflow-hidden bg-[#1a1c22] shadow-sm group cursor-pointer",
                dragActive ? "border-[#22ff88] bg-[#22ff88]/5 scale-[0.98]" : "border-white/5 hover:border-[#22ff88]/40"
              )}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#0f1115] rounded-xl md:rounded-2xl flex items-center justify-center text-[#64748b] group-hover:scale-110 group-hover:text-[#22ff88] transition-all shadow-inner">
                <Camera className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div className="text-center px-4 md:px-6">
                <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-white">Upload</p>
                <p className="text-[8px] md:text-[10px] text-[#64748b] mt-1 font-medium">Recomendado: 400x400</p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6 bg-[#22ff88]/5 border border-[#22ff88]/10 rounded-2xl">
            <h4 className="text-[9px] md:text-[10px] font-bold text-[#22ff88] uppercase tracking-widest mb-3">Onboarding Status</h4>
            <div className="space-y-3">
              {[
                { label: "Perfil", done: true },
                { label: "Workspace", done: false },
                { label: "Convite", done: false },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={cn("w-1.5 h-1.5 rounded-full", step.done ? "bg-[#22ff88]" : "bg-white/5")} />
                  <span className={cn("text-[8px] md:text-[10px] font-bold uppercase tracking-wider", step.done ? "text-white" : "text-[#64748b]")}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
