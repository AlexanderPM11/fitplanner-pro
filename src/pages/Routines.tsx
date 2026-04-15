import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Dumbbell, Trash2, Play, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useNotification } from '../context/NotificationContext';
import type { Workout } from '../types';

const Routines = () => {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { showToast } = useNotification();

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_template', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching routines:', error);
    } else {
      setRoutines(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Error al eliminar la rutina', 'error');
    } else {
      showToast('Rutina eliminada', 'success');
      setRoutines(routines.filter(r => r.id !== id));
    }
    setConfirmDeleteId(null);
  };

  const filteredRoutines = routines.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      <Helmet>
        <title>Mis Rutinas | FitPlanner Pro</title>
      </Helmet>

      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Biblioteca de Entrenamiento</h2>
          <h1 className="text-3xl font-black tracking-tight italic uppercase">Mis Rutinas</h1>
        </div>
        <button 
          onClick={() => navigate('/workout?template=true')}
          className="p-3 bg-primary text-black rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
        <input 
          type="text"
          placeholder="Busca en tu biblioteca..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 transition-colors text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredRoutines.length > 0 ? (
              filteredRoutines.map((routine, idx) => (
                <div key={routine.id} className="relative group overflow-hidden rounded-[2rem] bg-black/20">
                  {/* Foreground Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -100 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigate(`/workout?editId=${routine.id}`)}
                    className="glass-card p-5 group relative cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98] z-10 select-none"
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(routine.id);
                      }}
                      className="absolute top-4 right-4 p-2.5 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 md:opacity-0 focus:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                      title="Eliminar rutina"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                          <Dumbbell size={24} />
                        </div>
                        <div>
                          <h3 className="font-black italic uppercase tracking-tight text-lg leading-tight group-hover:text-primary transition-colors">
                            {routine.name}
                          </h3>
                          <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-0.5">
                            {routine.description || 'Sin descripción'}
                          </p>
                        </div>
                      </div>

                    </div>

                    <div className="mt-6 flex items-center space-x-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/planner`);
                        }}
                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Asignar a Calendario
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workout?templateId=${routine.id}`);
                        }}
                        className="p-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-black rounded-xl border border-primary/20 transition-all"
                        title="Empezar Sesión Ahora"
                      >
                        <Play size={16} fill="currentColor" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5 opacity-50">
                <Dumbbell size={48} className="mx-auto mb-4 text-white/10" />
                <p className="font-bold uppercase italic tracking-tighter">No hay rutinas guardadas</p>
                <button 
                  onClick={() => navigate('/workout?template=true')}
                  className="text-primary text-xs font-black uppercase mt-2 hover:underline"
                >
                  Crea tu primera rutina
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card p-8 w-full max-w-sm relative z-10 border-red-500/20 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-white">¿Eliminar Rutina?</h3>
                <p className="text-sm text-white/50 mb-8 leading-relaxed">
                  Esta acción no se puede deshacer. Perderás esta rutina de tu biblioteca permanentemente.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={() => setConfirmDeleteId(null)}
                    className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleDelete(confirmDeleteId)}
                    className="py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-red-600/20 transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Routines;
