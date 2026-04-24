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
  DollarSign,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  userData: any;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeView, onViewChange, userData, isOpen, onClose }: SidebarProps) {
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
    <aside className={cn(
      "fixed inset-y-0 left-0 lg:static w-64 bg-[#0f1115] text-white flex flex-col h-screen z-50 border-r border-white/5 transition-transform duration-300 ease-in-out lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-5 md:p-8 pb-4 relative h-full flex flex-col">
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 text-[#64748b] hover:text-white transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="mb-6 md:mb-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-baseline gap-0.5 leading-none">
              Construtor
              <span className="text-base md:text-lg text-[#22ff88] font-black font-display tracking-normal">360</span>
            </h1>
          </div>
        </div>
        
        <div className="space-y-6 md:space-y-8 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar pr-1 md:pr-2">
          {/* Main Navigation */}
          <nav className="space-y-1">
            <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-[#64748b] font-bold mb-3 md:mb-4 px-3 md:px-4">Navegação</p>
            {menuItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  if (window.innerWidth < 1024) onClose?.();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 md:px-4 py-2 md:py-2.5 text-sm font-medium transition-all rounded-xl text-left group",
                  activeView === item.id 
                    ? "bg-white/10 text-white" 
                    : "text-[#64748b] hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "w-4 md:w-4.5 h-4 md:h-4.5 transition-colors",
                  activeView === item.id ? "text-[#22ff88]" : "group-hover:text-[#22ff88]"
                )} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Admin Section (Professor) */}
          {(userRole === 'administrador' || userRole === 'master') && (
            <nav className="space-y-1">
              <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-[#22ff88] font-bold mb-3 md:mb-4 px-3 md:px-4">Console Professor</p>
              {adminItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    if (window.innerWidth < 1024) onClose?.();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 md:px-4 py-2 md:py-2.5 text-sm font-medium transition-all rounded-xl text-left group",
                    activeView === item.id 
                      ? "bg-[#22ff88]/10 text-white" 
                      : "text-[#64748b] hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 md:w-4.5 h-4 md:h-4.5 transition-colors",
                    activeView === item.id ? "text-[#22ff88]" : "group-hover:text-[#22ff88]"
                  )} />
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Master Admin Section */}
          {userRole === 'master' && (
            <nav className="space-y-1">
              <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-red-400 font-bold mb-3 md:mb-4 px-3 md:px-4">Admin Master</p>
              {masterItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    if (window.innerWidth < 1024) onClose?.();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 md:px-4 py-2 md:py-2.5 text-sm font-medium transition-all rounded-xl text-left group",
                    activeView === item.id 
                      ? "bg-red-400/10 text-white" 
                      : "text-[#64748b] hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 md:w-4.5 h-4 md:h-4.5 transition-colors",
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
