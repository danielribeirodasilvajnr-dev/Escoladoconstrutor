import { 
  PlaySquare, 
  BookOpen, 
  Map, 
  Play, 
  Award, 
  Users2,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: "vitrine", icon: PlaySquare, label: "Vitrine" },
    { id: "suporte", icon: BookOpen, label: "Suporte Educação" },
    { id: "trilhas", icon: Map, label: "Trilhas" },
    { id: "overview", icon: Play, label: "Meus Cursos" },
    { id: "certificados", icon: Award, label: "Certificados" },
    { id: "comunidade", icon: Users2, label: "Comunidade" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="w-64 bg-[#0f1115] text-white flex flex-col h-screen sticky top-0 z-40 border-r border-white/5">
      <div className="p-8">
        <div className="mb-12">
          <h1 className="text-xl font-bold tracking-tight text-white flex flex-col leading-none">
            Engineering
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#22ff88] mt-1 font-medium font-mono">Auteur Series</span>
          </h1>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-xl text-left group",
                activeView === item.id 
                  ? "bg-white/10 text-white" 
                  : "text-[#64748b] hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                activeView === item.id ? "text-[#22ff88]" : "group-hover:text-[#22ff88]"
              )} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-6">
        {/* Next Lesson Card */}
        <div className="bg-[#1a1c22] rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-[#64748b] font-bold mb-2">Próxima Aula</p>
          <h4 className="text-sm font-bold mb-4 text-white">Structural Dynamics II</h4>
          <button className="w-full py-2.5 bg-[#22ff88] text-black text-[11px] font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
            Continuar Assistindo
          </button>
        </div>

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
