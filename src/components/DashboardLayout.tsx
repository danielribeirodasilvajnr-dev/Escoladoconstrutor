import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  userData: any;
}

export function DashboardLayout({ children, activeView, onViewChange, userData }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0f1115] text-white font-sans selection:bg-[#22ff88] selection:text-black overflow-hidden relative">
      <Sidebar 
        activeView={activeView} 
        onViewChange={(view) => {
          onViewChange(view);
          setIsSidebarOpen(false);
        }} 
        userData={userData}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Immersive background decoration */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#22ff88]/5 rounded-full blur-[120px] -z-10" />
        
        <Navbar 
          userData={userData} 
          activeView={activeView} 
          onViewChange={onViewChange}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
