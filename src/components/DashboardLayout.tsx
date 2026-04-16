import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  onNewAction?: () => void;
}

export function DashboardLayout({ children, activeView, onViewChange, onNewAction }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-surface text-ink font-sans selection:bg-accent selection:text-white overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={onViewChange} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onNewAction={onNewAction} />
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Global Footer */}
        <div className="h-10 border-t border-ink/5 bg-paper flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6 text-[9px] font-bold text-muted uppercase tracking-[0.25em]">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              <span>CORE: STABLE</span>
            </div>
            <span>LATENCY: 12ms</span>
            <span>NODES: 4,021</span>
          </div>
          <div className="text-[10px] font-display font-medium text-muted">
            AURORA CLOUD OS v2.4.0
          </div>
        </div>
      </main>
    </div>
  );
}
