import { NavLink } from 'react-router-dom';
import { LayoutDashboard, User, Calendar, Dumbbell } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl rounded-b-none border-x-0 border-b-0 px-6 pb-8 pt-4 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={24} />
          <span className="text-[10px] mt-1 font-medium italic uppercase tracking-tighter">Inicio</span>
        </NavLink>
        
        <NavLink to="/planner" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Calendar size={24} />
          <span className="text-[10px] mt-1 font-medium italic uppercase tracking-tighter">Mi Semana</span>
        </NavLink>

        <NavLink to="/routines" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Dumbbell size={24} />
          <span className="text-[10px] mt-1 font-medium italic uppercase tracking-tighter">Rutinas</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={24} />
          <span className="text-[10px] mt-1 font-medium italic uppercase tracking-tighter">Perfil</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
