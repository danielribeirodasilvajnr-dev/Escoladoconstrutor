import { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { DashboardOverview } from './DashboardOverview';
import { AddClientsView } from './AddClientsView';

type DashboardView = 'vitrine' | 'suporte' | 'trilhas' | 'overview' | 'certificados' | 'comunidade' | 'team' | 'settings';

export function Dashboard() {
  const [activeView, setActiveView] = useState<DashboardView>('overview');

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <DashboardOverview />;
      case 'team':
        return <AddClientsView />;
      default:
        return (
          <div className="p-12 flex items-center justify-center h-[calc(100vh-80px)]">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-[#22ff88]/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#22ff88]/20">
                <span className="text-3xl text-[#22ff88]">⚡</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Módulo em Desenvolvimento</h2>
              <p className="text-[#64748b] leading-relaxed">
                Estamos preparando o acesso aos sistemas de {activeView}. 
                Em breve, novas trilhas e conteúdos estarão disponíveis no seu console.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout 
      activeView={activeView} 
      onViewChange={(view) => setActiveView(view as DashboardView)}
    >
      {renderView()}
    </DashboardLayout>
  );
}
