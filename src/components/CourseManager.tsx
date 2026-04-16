import { 
  Plus, 
  Search, 
  Play, 
  FileText, 
  Settings, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Eye, 
  Globe, 
  DollarSign, 
  Users, 
  Star,
  Image as ImageIcon
} from 'lucide-react';

interface CourseManagerProps {
  userData: any;
  onViewChange: (view: string) => void;
}

export function CourseManager({ userData, onViewChange }: CourseManagerProps) {
  const avatarUrl = userData?.avatar_url || `https://i.pravatar.cc/100?u=${userData?.email}`;
  
  return (
    <div className="p-10 max-w-[1600px] mx-auto pb-20">
      <header className="flex justify-between items-start mb-12">
        <div className="max-w-xl">
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.2em] mb-4">Arquitetura de Cursos / Professor</p>
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            Course <span className="text-[#22ff88]">Genesis</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <button className="px-8 py-3.5 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
            Pré-visualizar Experiência
          </button>
          <button className="px-8 py-3.5 bg-[#22ff88] text-black font-bold rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(34,255,136,0.2)]">
            PUBLICAR MASTERCLASS
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-12">
        {/* Main Editor Section */}
        <div className="space-y-12">
          {/* Cover Upload */}
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#1a1c22] group cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1600&h=900&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" 
              alt="Course Cover" 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-md group-hover:scale-110 transition-transform">
                <ImageIcon className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-1">UPLOAD DE CAPA CINEMATOGRÁFICA</h3>
                <p className="text-[#64748b] text-xs">Recomendado: 1920x1080px (PNG/JPG)</p>
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-8">
            <div>
              <label className="text-[9px] font-bold text-[#22ff88] uppercase tracking-[0.2em] mb-4 block">Título do Curso</label>
              <div className="bg-[#1a1c22] border border-white/5 rounded-2xl p-6">
                 <input 
                   type="text" 
                   defaultValue="Dinâmica Estrutural: Master Class"
                   className="bg-transparent border-none text-4xl font-bold text-white w-full focus:outline-none placeholder:text-white/20"
                 />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-[#22ff88] uppercase tracking-[0.2em] mb-4 block">Descrição Técnica</label>
              <textarea 
                placeholder="Descreva o resultado de engenharia deste curso..."
                className="w-full bg-[#1a1c22] border border-white/5 rounded-2xl p-8 text-white text-lg min-h-[200px] focus:outline-none focus:border-[#22ff88]/30 transition-all resize-none"
              />
            </div>
          </div>

          {/* Curriculum Architecture */}
          <section className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                ARQUITETURA DO <span className="text-[#22ff88]">CURRÍCULO</span>
              </h2>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-white/5 text-[#22ff88] text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors border border-[#22ff88]/10">
                <Plus className="w-4 h-4" />
                NOVO MÓDULO
              </button>
            </div>

            <div className="space-y-6">
              {/* Module 01 */}
              <div className="bg-[#1a1c22] border-l-4 border-[#22ff88] rounded-3xl overflow-hidden border border-white/5">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                     <span className="text-2xl font-mono text-white/10">⋮⋮</span>
                     <h3 className="text-lg font-bold text-white">Módulo 01: Fundamentos de Ressonância</h3>
                   </div>
                   <div className="flex gap-4 text-[#64748b]">
                     <button className="hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                     <button className="hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
                   </div>
                </div>
                <div className="p-8 space-y-4">
                  {[
                    { id: "1.1", title: "Introdução ao Movimento Oscilatório", duration: "12:45 MIN", type: "video" },
                    { id: "1.2", title: "Equações Técnicas & Diagramas (PDF)", duration: "RECURSOS", type: "pdf" },
                    { id: "1.3", title: "Sistemas de Um Grau de Liberdade", duration: "42:10 MIN", type: "video" }
                  ].map((lesson) => (
                    <div key={lesson.id} className="bg-[#0f1115] border border-white/5 rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:border-white/10 transition-all">
                       <div className="flex items-center gap-4">
                         {lesson.type === 'video' ? <Play className="w-4 h-4 text-[#22ff88] fill-current" /> : <FileText className="w-4 h-4 text-[#22ff88]" />}
                         <span className="text-sm font-bold text-white/60 group-hover:text-white">{lesson.id} {lesson.title}</span>
                       </div>
                       <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest">{lesson.duration}</span>
                    </div>
                  ))}
                  <button className="flex items-center gap-2 text-[10px] font-bold text-[#64748b] uppercase tracking-widest mt-4 hover:text-[#22ff88] transition-colors pl-4">
                    + ADICIONAR AULA
                  </button>
                </div>
              </div>

              {/* Module 02 */}
              <div className="bg-[#1a1c22] rounded-3xl overflow-hidden border border-white/5">
                <div className="p-8 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                     <span className="text-2xl font-mono text-white/5">⋮⋮</span>
                     <h3 className="text-lg font-bold text-white/40">Módulo 02: Análise de Cargas Harmônicas</h3>
                   </div>
                   <div className="flex gap-4 text-[#64748b]">
                     <button className="hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                     <button className="hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
                   </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
           {/* Control Logic */}
           <div className="bg-[#1a1c22] p-8 rounded-[2.5rem] border border-white/5">
             <div className="flex items-center gap-3 mb-10">
               <Settings className="w-4 h-4 text-[#22ff88]" />
               <h3 className="text-[10px] font-bold text-[#22ff88] uppercase tracking-[0.2em]">LÓGICA DE CONTROLE</h3>
             </div>

             <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-4">PREÇO DE INSCRIÇÃO (BRL)</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#22ff88]">R$</span>
                    <input 
                      type="text" 
                      defaultValue="1499,00"
                      className="w-full bg-[#0f1115] border border-white/5 rounded-xl px-12 py-5 text-2xl font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-[#0f1115] p-5 rounded-xl border border-white/5">
                   <div className="flex flex-col">
                     <span className="text-sm font-bold text-white">CERTIFICAÇÃO DIGITAL</span>
                   </div>
                   <div className="w-12 h-6 bg-[#22ff88] rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full" />
                   </div>
                </div>
                
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex gap-4">
                   <CheckCircle2 className="w-5 h-5 text-[#22ff88] shrink-0" />
                   <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                     Certificado de engenharia de elite com ID verificado em blockchain.
                   </p>
                </div>

                <div>
                   <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-4">VISIBILIDADE</p>
                   <div className="bg-[#0f1115] border border-white/5 rounded-xl px-4 py-4 flex justify-between items-center cursor-pointer">
                      <span className="text-sm font-bold text-white">Público - Marketplace</span>
                      <Settings className="w-4 h-4 text-[#64748b]" />
                   </div>
                </div>
             </div>
           </div>

           {/* Instructor Authority */}
           <div className="bg-[#1a1c22] p-10 rounded-[2.5rem] border border-white/5 text-center">
             <div className="flex items-center justify-center gap-3 mb-10">
               <Globe className="w-4 h-4 text-[#22ff88]" />
               <h3 className="text-[10px] font-bold text-[#22ff88] uppercase tracking-[0.2em]">AUTORIDADE DO INSTRUTOR</h3>
             </div>

             <div className="relative inline-block mb-8">
                <img 
                  src={avatarUrl} 
                  className="w-32 h-32 rounded-[2rem] object-cover border-2 border-[#22ff88]/30 p-1" 
                  alt="Instructor" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#22ff88] rounded-2xl flex items-center justify-center border-4 border-[#1a1c22]">
                   <CheckCircle2 className="w-5 h-5 text-black" />
                </div>
             </div>

             <h4 className="text-2xl font-bold text-white underline decoration-[#22ff88]/20 underline-offset-4">{userData?.name || 'Instrutor'}</h4>
             <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#22ff88] mt-2 mb-6 font-mono">Corpo Docente Verificado</p>
             
             <p className="text-sm text-[#64748b] leading-relaxed mb-8 px-4">
               {userData?.bio || 'Especialista em Engenharia com foco em inovação e integridade estrutural. Liderando a próxima geração de construtores.'}
             </p>

             <button 
               onClick={() => onViewChange('settings')}
               className="w-full py-4 bg-white/5 text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all mb-10"
             >
               EDITAR PERFIL DO CORPO DOCENTE
             </button>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0f1115] p-5 rounded-2xl border border-white/5">
                   <p className="text-2xl font-bold text-white mb-1">42k</p>
                   <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest">ALUNOS</p>
                </div>
                <div className="bg-[#0f1115] p-5 rounded-2xl border border-white/5">
                   <p className="text-2xl font-bold text-[#22ff88] mb-1">4.9/5</p>
                   <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest">AVALIAÇÃO</p>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
