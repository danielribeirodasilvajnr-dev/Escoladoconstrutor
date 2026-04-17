import { 
  PlaySquare, 
  BookOpen, 
  Map, 
  Play, 
  Award, 
  Users2,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Layers,
  DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  userData: any;
}

export function Sidebar({ activeView, onViewChange, userData }: SidebarProps) {
  const userRole = userData?.role || 'membro';
  const menuItems = [
    { id: "vitrine", icon: PlaySquare, label: "Vitrine" },
    { id: "overview", icon: Play, label: "Meus Cursos" },
    { id: "certificados", icon: Award, label: "Certificados" },
    { id: "comunidade", icon: Users2, label: "Comunidade" },
    { id: "suporte", icon: BookOpen, label: "Suporte Educação" },
  ];

  const adminItems = [
    { id: "admin-overview", icon: ShieldCheck, label: "Painel Geral" },
    { id: "admin-cursos", icon: Layers, label: "Gerenciar Cursos" },
  ];

  const masterItems = [
    { id: "admin-usuarios", icon: Users2, label: "Gestão de Usuários" },
    { id: "admin-financeiro", icon: DollarSign, label: "Gestão Financeira" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="w-64 bg-[#0f1115] text-white flex flex-col h-screen sticky top-0 z-40 border-r border-white/5">
      <div className="p-8 pb-4">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-baseline gap-0.5 leading-none">
            Construtor
            <span className="text-lg text-[#22ff88] font-black font-display tracking-normal">360</span>
          </h1>
        </div>
        
        <div className="space-y-8">
          {/* Main Navigation */}
          <nav className="space-y-1">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#64748b] font-bold mb-4 px-4">Navegação</p>
            {menuItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-xl text-left group",
                  activeView === item.id 
                    ? "bg-white/10 text-white" 
                    : "text-[#64748b] hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "w-4.5 h-4.5 transition-colors",
                  activeView === item.id ? "text-[#22ff88]" : "group-hover:text-[#22ff88]"
                )} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Admin Section (Professor) */}
          {(userRole === 'administrador' || userRole === 'master') && (
            <nav className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-500">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#22ff88] font-bold mb-4 px-4">Console Professor</p>
              {adminItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-xl text-left group",
                    activeView === item.id 
                      ? "bg-[#22ff88]/10 text-white" 
                      : "text-[#64748b] hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn(
                    "w-4.5 h-4.5 transition-colors",
                    activeView === item.id ? "text-[#22ff88]" : "group-hover:text-[#22ff88]"
                  )} />
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Master Admin Section */}
          {userRole === 'master' && (
            <nav className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-500">
              <p className="text-[9px] uppercase tracking-[0.2em] text-red-400 font-bold mb-4 px-4">Console Admin Master</p>
              {masterItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-xl text-left group",
                    activeView === item.id 
                      ? "bg-red-400/10 text-white" 
                      : "text-[#64748b] hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn(
                    "w-4.5 h-4.5 transition-colors",
                    activeView === item.id ? "text-red-400" : "group-hover:text-red-400"
                  )} />
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>

      <div className="mt-auto p-6 space-y-6">
        {/* Next Lesson Card */}
        {userRole !== 'administrador' && (
          <div className="bg-[#1a1c22] rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-[#64748b] font-bold mb-2">Próxima Aula</p>
            <h4 className="text-sm font-bold mb-4 text-white">Dinâmica Estrutural II</h4>
            <button className="w-full py-2.5 bg-[#22ff88] text-black text-[11px] font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
              Continuar Assistindo
            </button>
          </div>
        )}

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#64748b] hover:text-white transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
          Sair
        </button>
      </div>
    </aside>
  );
}
