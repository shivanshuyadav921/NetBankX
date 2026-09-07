import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-luxury-bg text-luxury-text selection:bg-luxury-slateLight selection:text-luxury-slate">
      {/* Dark Sidebar Signature Shell */}
      <Sidebar />
      {/* Warm Ivory Enterprise Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden bg-luxury-bg">
        <Outlet />
      </main>
    </div>
  );
};
