import { Plus, Trash2, Play, CheckCircle } from 'lucide-react';
import type { Schedule, ScheduleCompletion } from '../../types';
import { motion } from 'framer-motion';

interface DayCardProps {
  dayName: string;
  dayIndex: number;
  schedules: Schedule[];
  completions: ScheduleCompletion[];
  onAddWorkout: (dayIndex: number) => void;
  onRemoveSchedule: (scheduleId: string) => void;
  onStartWorkout: (workoutId: string) => void;
  onToggleCompletion: (scheduleId: string) => void;
}

const DayCard: React.FC<DayCardProps> = ({ 
  dayName, 
  dayIndex, 
  schedules, 
  completions,
  onAddWorkout, 
  onRemoveSchedule,
  onStartWorkout,
  onToggleCompletion
}) => {
  const today = new Date().toISOString().split('T')[0];

  const isCompleted = (scheduleId: string) => {
    return completions.some(c => c.schedule_id === scheduleId && c.completed_at === today);
  };
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: dayIndex * 0.05 }}
      className="glass-card flex flex-col h-full min-h-[160px]"
    >
      <div className="p-3 border-b border-white/5 flex justify-between items-center">
        <h3 className="font-black italic uppercase tracking-tighter text-sm">{dayName}</h3>
        <button 
          onClick={() => onAddWorkout(dayIndex)}
          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      
      <div className="p-3 flex-1 space-y-2">
        {schedules.length > 0 ? (
          schedules.map((s) => (
            <div 
              key={s.id} 
              className={`group relative rounded-xl p-3 border transition-all ${isCompleted(s.id) ? 'bg-primary/10 border-primary/50' : 'bg-white/5 border-white/5 hover:border-primary/30'}`}
            >
              <div className="pr-12">
                <div className="flex items-center space-x-2">
                  <h4 className={`font-bold text-xs truncate uppercase italic ${isCompleted(s.id) ? 'text-primary' : ''}`}>
                    {s.workout?.name || 'Entrenamiento'}
                  </h4>
                  {isCompleted(s.id) && <CheckCircle size={10} className="text-primary" />}
                </div>
                <p className={`text-[10px] uppercase font-bold tracking-widest mt-0.5 ${isCompleted(s.id) ? 'text-primary/50' : 'text-white/30'}`}>
                  {isCompleted(s.id) ? 'Completado' : 'Programado'}
                </p>
              </div>
              
              <div className="absolute top-2 right-2 flex flex-col space-y-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onToggleCompletion(s.id)}
                  className={`p-1 rounded-md transition-colors ${isCompleted(s.id) ? 'bg-primary text-black' : 'bg-white/10 text-white/40 hover:text-white'}`}
                  title={isCompleted(s.id) ? "Marcar como incompleto" : "Marcar como completado"}
                >
                  <CheckCircle size={10} />
                </button>
                {!isCompleted(s.id) && (
                  <button 
                    onClick={() => onStartWorkout(s.workout_id)}
                    className="p-1 rounded-md bg-primary text-black hover:scale-110 transition-transform"
                    title="Empezar Sesión"
                  >
                    <Play size={10} fill="currentColor" />
                  </button>
                )}
                <button 
                  onClick={() => onRemoveSchedule(s.id)}
                  className="p-1 rounded-md bg-red-500/10 text-red-500/40 hover:bg-red-500 hover:text-white transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-4 border-2 border-dashed border-white/5 rounded-2xl opacity-30">
            <p className="text-[10px] uppercase font-bold tracking-widest">Día de Descanso</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DayCard;
