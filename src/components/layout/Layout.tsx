import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-white pb-32">
      <main className="container mx-auto px-4 pt-8">
        {children}
      </main>
      <Navbar />
    </div>
  );
};

export default Layout;
