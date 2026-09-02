import { NavLink } from 'react-router-dom';
import { LayoutDashboard, User, Calendar, Dumbbell } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#091510]/90 backdrop-blur-2xl border-t border-white/10 px-3 pt-2 safe-bottom z-50">
      <div className="flex justify-around items-center mobile-shell">
        <NavLink aria-label="Inicio" to="/" className={({ isActive }) => `nav-item tap-target ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={24} />
          <span className="text-[10px] mt-1 font-bold uppercase tracking-tight">Inicio</span>
        </NavLink>
        
        <NavLink aria-label="Semana" to="/planner" className={({ isActive }) => `nav-item tap-target ${isActive ? 'active' : ''}`}>
          <Calendar size={24} />
          <span className="text-[10px] mt-1 font-bold uppercase tracking-tight">Semana</span>
        </NavLink>

        <NavLink aria-label="Rutinas" to="/routines" className={({ isActive }) => `nav-item tap-target ${isActive ? 'active' : ''}`}>
          <Dumbbell size={24} />
          <span className="text-[10px] mt-1 font-bold uppercase tracking-tight">Rutinas</span>
        </NavLink>

        <NavLink aria-label="Perfil" to="/profile" className={({ isActive }) => `nav-item tap-target ${isActive ? 'active' : ''}`}>
          <User size={24} />
          <span className="text-[10px] mt-1 font-bold uppercase tracking-tight">Perfil</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
