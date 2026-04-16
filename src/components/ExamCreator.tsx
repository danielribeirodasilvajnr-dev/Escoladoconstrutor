import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  Star, 
  Shield, 
  Trash2, 
  Copy, 
  Plus, 
  CheckCircle2, 
  Info, 
  AlertTriangle,
  FileText,
  Upload
} from 'lucide-react';

export function ExamCreator() {
  const [questions, setQuestions] = useState([{ id: 1, text: '', alternatives: ['', '', ''] }]);

  return (
    <div className="p-10 max-w-[1600px] mx-auto pb-20">
      <header className="flex justify-between items-end mb-12">
        <div className="max-w-xl">
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Console de Criação: <span className="text-[#22ff88]">Exame Final</span>
          </h1>
          <p className="text-[#64748b] text-base leading-relaxed">
            Defina os parâmetros técnicos e construa a avaliação de integridade estrutural para a trilha de Engenharia Avançada.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="px-8 py-3.5 bg-transparent border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-all">
            SALVAR RASCUNHO
          </button>
          <button className="px-8 py-3.5 bg-[#22ff88] text-black font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,255,136,0.2)]">
            PUBLICAR PROVA
          </button>
        </div>
      </header>

      {/* Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#1a1c22] p-8 rounded-3xl border border-white/5 relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#22ff88]/40" />
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-[#22ff88]" />
            <h3 className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Parâmetros de Tempo</h3>
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Tempo Limite (Minutos)</p>
          <input 
            type="text" 
            defaultValue="120"
            className="w-full bg-[#0f1115] border border-white/5 rounded-lg px-4 py-3 text-white font-bold text-xl focus:outline-none focus:border-[#22ff88]/30 transition-all"
          />
        </div>

        <div className="bg-[#1a1c22] p-8 rounded-3xl border border-white/5 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00ffcc]/40" />
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-5 h-5 text-[#00ffcc]" />
            <h3 className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Exigência Mínima</h3>
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Nota de Corte (0-100)</p>
          <input 
            type="text" 
            defaultValue="75"
            className="w-full bg-[#0f1115] border border-white/5 rounded-lg px-4 py-3 text-white font-bold text-xl focus:outline-none focus:border-[#00ffcc]/30 transition-all"
          />
        </div>

        <div className="bg-[#1a1c22] p-8 rounded-3xl border border-white/5 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/40" />
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-blue-500" />
            <h3 className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Controle de Acesso</h3>
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Tentativas Permitidas</p>
          <select className="w-full bg-[#0f1115] border border-white/5 rounded-lg px-4 py-3 text-white font-bold text-lg focus:outline-none appearance-none cursor-pointer">
            <option>Única tentativa</option>
            <option>2 Tentativas</option>
            <option>Ilimitado</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Question Editor */}
        <div className="lg:col-span-2 space-y-8">
          {questions.map((q, idx) => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#1a1c22] p-10 rounded-3xl border border-white/5"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <span className="text-[10px] font-bold text-[#22ff88] uppercase tracking-widest">Questão 0{idx + 1}</span>
                  <h3 className="text-xl font-bold text-white mt-1">Editor de Questão Técnica</h3>
                </div>
                <div className="flex gap-4 text-[#64748b]">
                  <button className="hover:text-white transition-colors"><Trash2 className="w-5 h-5" /></button>
                  <button className="hover:text-white transition-colors"><Copy className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest block mb-4">Enunciado da Pergunta</label>
                  <textarea 
                    placeholder="Descreva o problema técnico, incluindo especificações de carga e tensões críticas..."
                    className="w-full bg-[#0f1115] border border-white/5 rounded-2xl p-6 text-white text-base min-h-[160px] focus:outline-none focus:border-[#22ff88]/30 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest block mb-4">Alternativas de Resposta</label>
                  <div className="space-y-3">
                    {['A', 'B', 'C'].map((letter) => (
                      <div key={letter} className="flex gap-4 items-center group">
                        <div className="w-6 h-6 rounded-full border-2 border-white/10 flex-shrink-0 cursor-pointer group-hover:border-[#22ff88]/50 transition-all" />
                        <input 
                          type="text" 
                          defaultValue={letter === 'A' ? "Tensão máxima de escoamento excedida em 15%" : letter === 'B' ? "Coeficiente de segurança mantido em 1.5." : "Flambagem lateral-torcional identificada na seção"}
                          className="w-full bg-[#1a1c22] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-[#94a3b8] focus:outline-none focus:border-[#22ff88]/30 transition-all"
                        />
                      </div>
                    ))}
                    <button className="flex items-center gap-2 text-[10px] font-bold text-[#22ff88] uppercase tracking-widest mt-4 hover:translate-x-1 transition-transform">
                      <Plus className="w-4 h-4" />
                      Adicionar Alternativa
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Documents Support */}
          <div className="bg-[#1a1c22] p-10 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white">Documentos de Apoio</h2>
              <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest">PDF, DWG, PNG (Max 50MB)</span>
            </div>
            <div className="flex gap-4">
              <div className="bg-[#0f1115] border border-[#22ff88]/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 w-40 cursor-pointer hover:bg-white/5 transition-all text-center">
                 <FileText className="w-6 h-6 text-[#22ff88]" />
                 <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest leading-tight">PLANTA_NIVEL_01.DWG</span>
              </div>
              <div className="bg-transparent border border-white/5 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 w-40 cursor-pointer hover:bg-white/5 transition-all text-center">
                 <Upload className="w-6 h-6 text-[#64748b]" />
                 <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest leading-tight">NOVO PROJETO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-8">
          {/* Integrity Check */}
          <div className="bg-[#1a1c22] p-8 rounded-3xl border border-white/5">
            <h3 className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-8">Verificação de Integridade</h3>
            <div className="space-y-6">
              {[
                { title: "Enunciado Validado", desc: "Conteúdo Técnico identificado e processado.", icon: CheckCircle2, color: "text-[#22ff88]" },
                { title: "Alternativa Única", desc: "Apenas uma resposta correta selecionada.", icon: CheckCircle2, color: "text-[#22ff88]" },
                { title: "Complexidade: Alta", desc: "A questão exige análise de múltiplos diagramas.", icon: Info, color: "text-blue-400" },
                { title: "Risco de Ambiguidade", desc: "A Opção B e C possuem termos similares (78% match).", icon: AlertTriangle, color: "text-red-400", warning: true }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <item.icon className={cn("w-5 h-5 shrink-0 mt-0.5", item.color)} />
                  <div>
                    <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-1", item.color)}>{item.title}</h4>
                    <p className="text-[10px] text-[#64748b] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 bg-white/5 text-[#64748b] text-[10px] font-bold uppercase tracking-widest rounded-xl mt-12 hover:bg-white/10 hover:text-white transition-all">
              RE-ANALISAR QUESTÃO
            </button>
          </div>

          {/* Exam Summary */}
          <div className="bg-[#1a1c22] p-8 rounded-3xl border border-white/5">
            <h3 className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-8">Resumo do Exame</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center text-sm font-bold">
                 <span className="text-[#64748b]">Total de Questões</span>
                 <span className="text-white text-xl">01</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                 <span className="text-[#64748b]">Tempo Total Estimado</span>
                 <span className="text-white text-xl">120m</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-6 border-t border-white/5">
                 <span className="text-[#64748b]">Score de Dificuldade</span>
                 <span className="text-[#22ff88] text-xl font-mono">8.4/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] text-[#64748b] gap-8">
        <div className="space-y-4">
          <p className="font-bold text-white uppercase tracking-widest">Escola do Construtor</p>
          <p>© 2026 Escola do Construtor. Conteúdo de Precisão para o Engenheiro Moderno.</p>
        </div>
        <div className="flex gap-10 font-bold uppercase tracking-widest">
           <a href="#" className="hover:text-white transition-colors">Termos de Serviço</a>
           <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
           <a href="#" className="hover:text-white transition-colors">Contato Suporte</a>
        </div>
      </footer>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
