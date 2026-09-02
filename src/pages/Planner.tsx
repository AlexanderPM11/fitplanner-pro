import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Search, RotateCcw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { Schedule, Workout, ScheduleCompletion } from '../types';
import WeeklyCalendar from '../components/planner/WeeklyCalendar';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { backendDelete, backendGet, backendRequest } from '../api/backend';
import ConfirmationModal from '../components/shared/ConfirmationModal';

const Planner = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [completions, setCompletions] = useState<ScheduleCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState<number | null>(null); // day index
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useNotification();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const routines = await backendGet<Array<{ id: string; name: string; description: string | null }>>('/api/routines');
        const calendar = await backendGet<{ schedules: Schedule[]; completions: ScheduleCompletion[] }>('/api/schedules');
        setTemplates(routines.map((routine) => ({ id: routine.id, user_id: '', name: routine.name, description: routine.description, started_at: new Date().toISOString(), completed_at: null, is_template: true })));
        setSchedules(calendar.schedules); setCompletions(calendar.completions);
      } catch { showToast('No se pudo cargar tu semana', 'error'); }

      setLoading(false);
    };

    fetchAllData();
  }, []);

  const fetchSchedules = async () => {
    const data = await backendGet<{ schedules: Schedule[]; completions: ScheduleCompletion[] }>('/api/schedules');
    setSchedules(data.schedules); setCompletions(data.completions);
  };

  const handleAddWorkoutToDay = async (workoutId: string) => {
    if (showAddModal === null) return;

    try { await backendRequest('/api/schedules', { workoutId, dayOfWeek: showAddModal }); setShowAddModal(null); fetchSchedules(); } catch { showToast('Esta rutina ya está programada para este día.', 'error'); }
  };

  const handleRemoveSchedule = async (scheduleId: string) => {
    try { await backendDelete(`/api/schedules/${scheduleId}`); fetchSchedules(); } catch { showToast('No se pudo quitar la rutina.', 'error'); }
  };

  const handleStartWorkout = (workoutId: string) => {
    // Navigate to editor with the template ID to clone it
    navigate(`/workout?templateId=${workoutId}`);
  };

  const handleToggleCompletion = async (scheduleId: string) => {
    try { await backendRequest(`/api/schedules/${scheduleId}/toggle`, {}); fetchSchedules(); } catch { showToast('No se pudo actualizar el día.', 'error'); }
  };

  const handleClearAllCompletions = async () => {
    try { await backendDelete('/api/schedules/completions'); setCompletions([]); setShowClearConfirm(false); showToast('Semana reiniciada correctamente.', 'success'); } catch { showToast('No se pudieron limpiar los checks.', 'error'); }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      <Helmet>
        <title>Mi Semana | FitPlanner Pro</title>
      </Helmet>

      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Calendar size={20} />
            </div>
            <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Organización de Entrenamiento</h2>
          </div>
          <h1 className="page-title">Mi Semana</h1>
          <p className="text-white/30 text-xs font-medium mt-1">Organiza tu semana de entrenamiento de lunes a domingo.</p>
        </div>

        {completions.length > 0 && (
          <button 
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
          >
            <RotateCcw size={16} className="text-white/40 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Reiniciar Semana</span>
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <WeeklyCalendar 
          schedules={schedules}
          completions={completions}
          onAddWorkout={(day) => setShowAddModal(day)}
          onRemoveSchedule={handleRemoveSchedule}
          onStartWorkout={handleStartWorkout}
          onToggleCompletion={handleToggleCompletion}
        />
      )}

      {/* Add Workout Modal */}
      <AnimatePresence>
        {showAddModal !== null && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-black italic uppercase tracking-tighter text-xl">Asignar Rutina</h3>
                <button onClick={() => setShowAddModal(null)} className="p-2 hover:bg-white/5 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    type="text"
                    placeholder="Busca tus rutinas..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-primary/50 transition-colors text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((t) => (
                      <button 
                        key={t.id}
                        onClick={() => handleAddWorkoutToDay(t.id)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/30 rounded-2xl transition-all group text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold uppercase italic text-sm group-hover:text-primary transition-colors truncate">{t.name}</h4>
                          <div className="flex items-center space-x-2 mt-0.5">
                            {t.is_template ? (
                              <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Rutina</span>
                            ) : (
                              <span className="text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Sesión Pasada</span>
                            )}
                            <span className="text-[9px] text-white/20 uppercase font-black">
                              {new Date(t.started_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Calendar size={16} className="text-white/10 group-hover:text-primary/50 ml-3 shrink-0" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-10 space-y-3">
                      <p className="text-white/20 text-sm italic">Aún no tienes rutinas guardadas como plantillas.</p>
                      <button 
                        onClick={() => navigate('/workout')}
                        className="text-primary font-bold uppercase text-xs tracking-widest hover:underline"
                      >
                        Crear una Rutina
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmationModal 
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllCompletions}
        title="¿Reiniciar Semana?"
        message="Esto quitará el check de todas tus rutinas completadas en esta semana. Esta acción no se puede deshacer."
        confirmText="Reiniciar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Planner;
