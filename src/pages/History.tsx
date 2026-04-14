import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Dumbbell } from 'lucide-react';
import type { Workout } from '../types';
import { Helmet } from 'react-helmet-async';

const History = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
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
    }
    fetchHistory();
  }, []);

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
      <header>
        <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Training Log</h2>
        <h1 className="text-3xl font-black tracking-tight italic uppercase">History</h1>
      </header>

      {loading ? (
        <div className="py-20 text-center text-white/20 font-bold animate-pulse uppercase italic">Scanning Archives...</div>
      ) : workouts.length > 0 ? (
        <div className="space-y-4">
          {workouts.map((workout, idx) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-5 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mr-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-bold italic uppercase tracking-tighter group-hover:text-primary transition-colors">{workout.name}</h3>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
                    {formatDate(workout.started_at)}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-white/10 group-hover:text-primary translate-x-0 group-hover:translate-x-1 transition-all" />
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
