import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, History, User } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl rounded-b-none border-x-0 border-b-0 px-6 pb-8 pt-4 z-50">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={24} />
          <span className="text-[10px] mt-1 font-medium">Dashboard</span>
        </NavLink>
        
        <NavLink to="/workout" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Dumbbell size={24} />
          <span className="text-[10px] mt-1 font-medium">Workout</span>
        </NavLink>

        <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={24} />
          <span className="text-[10px] mt-1 font-medium">History</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={24} />
          <span className="text-[10px] mt-1 font-medium">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
