import React from 'react';
import Navbar from './Navbar';
import ReloadPrompt from '../shared/ReloadPrompt';
import { Dumbbell, Wifi } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-white pb-32">
      <ReloadPrompt />
      <main className="mobile-shell px-5 pt-5 sm:px-6 sm:pt-8">
        <div className="app-topbar">
          <div className="brand-lockup"><div className="brand-mark"><Dumbbell size={17} strokeWidth={2.8} /></div><div className="brand-name">FitPlanner <span>Pro</span></div></div>
          <div className="eyebrow flex items-center gap-1.5"><Wifi size={12} className="text-primary" /> Sincronizado</div>
        </div>
        {children}
      </main>
      <Navbar />
    </div>
  );
};

export default Layout;
