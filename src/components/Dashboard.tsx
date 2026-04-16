import { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { DashboardOverview } from './DashboardOverview';
import { AddClientsView } from './AddClientsView';

type DashboardView = 'overview' | 'projects' | 'team' | 'analytics' | 'billing' | 'settings';

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
          <div className="p-8 flex items-center justify-center h-[calc(100vh-120px)]">
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-muted mb-2 tracking-tighter uppercase">View Under Construction</h2>
              <p className="text-[10px] font-bold text-muted/40 uppercase tracking-[0.2em]">Deploying soon to the creative cloud...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout 
      activeView={activeView} 
      onViewChange={(view) => setActiveView(view as DashboardView)}
      onNewAction={() => setActiveView('team')}
    >
      {renderView()}
    </DashboardLayout>
  );
}
