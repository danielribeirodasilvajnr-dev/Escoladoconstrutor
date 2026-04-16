import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export function DashboardLayout({ children, activeView, onViewChange }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-[#0f1115] text-white font-sans selection:bg-[#22ff88] selection:text-black overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={onViewChange} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Immersive background decoration */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#22ff88]/5 rounded-full blur-[120px] -z-10" />
        
        <Navbar />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
