import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Dumbbell, Trash2, Edit2, Bookmark, Clock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Workout, Exercise } from '../types';
import { Helmet } from 'react-helmet-async';
import { useNotification } from '../context/NotificationContext';
import MediaModal from '../components/shared/MediaModal';

interface HistoryWorkout extends Workout {

  is_template: boolean;
  workout_exercises?: {
    exercise: {
      image_url: string | null;
    };
  }[];
}

const History = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<HistoryWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'routines'>('sessions');
  const [fsMedia, setFsMedia] = useState<{ url: string; title: string } | null>(null);
  const { showToast, confirm } = useNotification();

  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('workouts')
          .select(`
            *,
            workout_exercises (
              exercise:exercises ( image_url )
            )
          `)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false });
        if (data) setWorkouts(data);
      }
      setLoading(false);
    };

    initFetch();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isConfirmed = await confirm('Are you sure you want to delete this? This action cannot be undone.');
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Error deleting workout', 'error');
    } else {
      setWorkouts(workouts.filter(w => w.id !== id));
      showToast('Workout deleted successfully', 'success');
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/workout?editId=${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8">
      <Helmet>
        <title>Historial | FitPlanner Pro</title>
        <meta name="description" content="Revisa tu historial de entrenamientos y analiza tu consistencia a lo largo del tiempo." />
      </Helmet>
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Management</h2>
          <h1 className="text-3xl font-black tracking-tight italic uppercase">Workouts</h1>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center space-x-2 ${activeTab === 'sessions' ? 'bg-primary text-black' : 'text-white/30 hover:text-white/50'}`}
          >
            <Clock size={12} />
            <span>Log</span>
          </button>
          <button 
            onClick={() => setActiveTab('routines')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center space-x-2 ${activeTab === 'routines' ? 'bg-primary text-black' : 'text-white/30 hover:text-white/50'}`}
          >
            <Bookmark size={12} />
            <span>Library</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="py-20 text-center text-white/20 font-bold animate-pulse uppercase italic">Scanning Archives...</div>
      ) : workouts.filter(w => activeTab === 'routines' ? w.is_template : !w.is_template).length > 0 ? (
        <div className="space-y-4">
          {workouts
            .filter(w => activeTab === 'routines' ? w.is_template : !w.is_template)
            .map((workout, idx) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleEdit(workout.id)}
              className="glass-card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all"
            >
              <div className="flex items-center min-w-0 flex-1">
                <div className="flex -space-x-3 mr-4">
                  {workout.workout_exercises?.slice(0, 3).map((we: any, idx: number) => {
                    const exercise = Array.isArray(we.exercise) ? we.exercise[0] : we.exercise;
                    return (
                      <div 
                        key={idx} 
                        className="w-10 h-10 rounded-xl border-2 border-background bg-white/5 overflow-hidden shrink-0 hover:scale-110 hover:z-10 transition-transform cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (exercise?.image_url) {
                            setFsMedia({ url: exercise.image_url, title: workout.name || 'Ejercicio' });
                          }
                        }}
                      >
                        {exercise?.image_url ? (
                          exercise.image_url.includes('.mp4') || exercise.image_url.includes('.webm') ? (
                            <video src={exercise.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                          ) : (
                            <img src={exercise.image_url} alt="exercise" className="w-full h-full object-cover" />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/5 bg-white/5 uppercase text-[8px] font-bold">
                            <Activity size={12} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(!workout.workout_exercises || workout.workout_exercises.length === 0) && (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${workout.is_template ? 'bg-primary/10 text-primary' : 'bg-white/5 text-white/40'}`}>
                      {workout.is_template ? <Bookmark size={18} /> : <Calendar size={18} />}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold italic uppercase tracking-tighter group-hover:text-primary transition-colors truncate">{workout.name}</h3>
                  <p className="text-[10px] text-white/30 uppercase font-black">
                    {workout.is_template ? 'Template' : formatDate(workout.started_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(workout.id); }}
                  className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, workout.id)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500/40 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center space-y-4 opacity-50 italic">
          <Dumbbell size={48} className="mx-auto text-white/10" />
          <p className="text-sm font-medium">No workouts recorded yet.<br/>Time to get to work!</p>
        </div>
      )}

      <MediaModal 
        isOpen={!!fsMedia}
        url={fsMedia?.url || ''}
        title={fsMedia?.title || ''}
        onClose={() => setFsMedia(null)}
      />
    </div>
  );
};

export default History;
