import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Dumbbell, Trash2, Edit2, Bookmark, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Workout } from '../types';
import { Helmet } from 'react-helmet-async';
import { useNotification } from '../context/NotificationContext';

const History = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'routines'>('sessions');
  const { showToast, confirm } = useNotification();

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });
      if (data) setWorkouts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
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
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 transition-colors ${workout.is_template ? 'bg-primary/10 text-primary' : 'bg-white/5 text-white/40'}`}>
                  {workout.is_template ? <Bookmark size={20} /> : <Calendar size={20} />}
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
    </div>
  );
};

export default History;
