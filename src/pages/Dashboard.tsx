import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Activity, Dumbbell, CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MediaModal from '../components/shared/MediaModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Profile } from '../types';

interface DashboardWorkoutSet {
  weight: number | null;
  reps: number | null;
  completed: boolean;
}

interface DashboardWorkoutExercise {
  exercise?: { image_url: string | null };
  sets: DashboardWorkoutSet[];
}

interface RecentWorkout {
  id: string;
  name: string | null;
  started_at: string;
  workout_exercises: DashboardWorkoutExercise[];
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weeklyVolume, setWeeklyVolume] = useState<number>(0);
  const [weeklyWorkoutsCount, setWeeklyWorkoutsCount] = useState<number>(0);
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [fsMedia, setFsMedia] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileData) setProfile(profileData);

      // Calculate start of week (Sunday or Monday, let's use a 7 day ago window for simplicity or true start of week)
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);

      // 2. Fetch Weekly Metrics (Workouts completed this week)
      const { data: weeklyData } = await supabase
        .from('workouts')
        .select(`
          id,
          workout_exercises (
            sets ( weight, reps, completed )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_template', false)
        .not('completed_at', 'is', null)
        .gte('started_at', startOfWeek.toISOString());

      if (weeklyData) {
        setWeeklyWorkoutsCount(weeklyData.length);
        
        let totalVolume = 0;
        weeklyData.forEach(workout => {
          workout.workout_exercises.forEach((we: DashboardWorkoutExercise) => {
            we.sets.forEach((set: DashboardWorkoutSet) => {
              if (set.completed && set.weight && set.reps) {
                totalVolume += (set.weight * set.reps);
              }
            });
          });
        });
        setWeeklyVolume(totalVolume);
      }

      // 3. Fetch Recent Activity (Last 3 workouts)
      const { data: recentData } = await supabase
        .from('workouts')
        .select(`
          id,
          name,
          started_at,
          workout_exercises (
            exercise:exercises ( image_url ),
            sets ( weight, reps, completed )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_template', false)
        .not('completed_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(3);

      if (recentData) {
        // Flatten the exercise array returned by Supabase join
        const formattedData = recentData.map((workout: any) => ({
          ...workout,
          workout_exercises: workout.workout_exercises.map((we: any) => ({
            ...we,
            exercise: Array.isArray(we.exercise) ? we.exercise[0] : we.exercise
          }))
        }));
        setRecentWorkouts(formattedData as RecentWorkout[]);
      }
      
      setLoadingMetrics(false);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <Helmet>
        <title>Dashboard | FitPlanner Pro</title>
        <meta name="description" content="Visualiza tu progreso, volumen semanal y récords personales en tu tablero de FitPlanner Pro." />
      </Helmet>
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Athlete Dashboard</h2>
          <h1 className="text-3xl font-black tracking-tight italic">
            {profile?.full_name?.split(' ')[0] || 'CRUSH IT!'}
          </h1>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            profile?.full_name?.charAt(0) || '?'
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-5 border-l-4 border-l-primary"
        >
          <div className="flex items-center text-white/30 mb-2">
            <Activity size={14} className="mr-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Volumen Semanal</span>
          </div>
          <p className="text-2xl font-black italic">
            {loadingMetrics ? '--' : weeklyVolume.toLocaleString()} <span className="text-xs font-normal text-white/30 not-italic">kg</span>
          </p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-5 border-l-4 border-l-secondary"
        >
          <div className="flex items-center text-white/30 mb-2">
            <CalendarCheck size={14} className="mr-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Sesiones (Semana)</span>
          </div>
          <p className="text-2xl font-black italic">
            {loadingMetrics ? '--' : weeklyWorkoutsCount}
          </p>
        </motion.div>
      </div>

      {/* Active Session Call to Action */}
      <div className="relative group overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-primary to-secondary text-black shadow-[0_20px_50px_rgba(0,242,255,0.3)]">
        <div className="relative z-10">
          <h3 className="text-2xl font-black italic mb-1 uppercase tracking-tighter">Ready to lift?</h3>
          <p className="text-black/60 text-sm font-medium mb-6">Your next workout is waiting for you.</p>
          <Link 
            to="/workout"
            className="inline-flex items-center bg-black text-white px-6 py-3 rounded-2xl font-bold transition-transform active:scale-95"
          >
            <Plus size={20} className="mr-2" />
            Start Session
          </Link>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
        <Dumbbell className="absolute -bottom-4 -right-4 w-32 h-32 text-black/10 -rotate-12" size={120} />
      </div>

      {/* Recent Activity List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-lg uppercase tracking-tight italic">Actividad Reciente</h4>
          <Link to="/history" className="text-primary text-xs font-bold uppercase hover:underline">Ver Todo</Link>
        </div>
        
        <div className="space-y-3">
          {loadingMetrics ? (
            <div className="glass-card p-4 flex items-center justify-center opacity-50 animate-pulse">
              <span className="text-sm font-bold uppercase tracking-widest text-white/30">Cargando...</span>
            </div>
          ) : recentWorkouts.length > 0 ? (
            recentWorkouts.map((workout: RecentWorkout) => {
              let vol = 0;
              workout.workout_exercises?.forEach((we: DashboardWorkoutExercise) => {
                we.sets?.forEach((set: DashboardWorkoutSet) => {
                  if (set.completed && set.weight && set.reps) {
                    vol += (set.weight * set.reps);
                  }
                });
              });

              return (
                <div key={workout.id} className="glass-card p-4 flex items-center justify-between group hover:border-primary/50 transition-colors">
                  <div className="flex items-center">
                    <div className="flex -space-x-3 mr-4">
                      {workout.workout_exercises?.slice(0, 3).map((we: DashboardWorkoutExercise, idx: number) => (
                        <div 
                          key={idx} 
                          className="w-10 h-10 rounded-xl border-2 border-background bg-white/5 overflow-hidden shrink-0 hover:scale-110 hover:z-10 transition-transform cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (we.exercise?.image_url) {
                              setFsMedia({ url: we.exercise.image_url, title: workout.name || 'Ejercicio' });
                            }
                          }}
                        >
                          {we.exercise?.image_url ? (
                            we.exercise.image_url.includes('.mp4') || we.exercise.image_url.includes('.webm') ? (
                              <video src={we.exercise.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                            ) : (
                              <img src={we.exercise.image_url} alt="exercise" className="w-full h-full object-cover" />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/5 bg-white/5 uppercase text-[8px] font-bold">
                              <Activity size={14} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm tracking-tight">{workout.name || 'Sesión sin nombre'}</h5>
                      <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                        {format(new Date(workout.started_at), "d MMM, yyyy", { locale: es })} • {vol} kg
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-primary transition-colors" />
                </div>
              );
            })
          ) : (
             <div className="glass-card p-6 text-center opacity-50 flex flex-col items-center justify-center">
               <Dumbbell size={24} className="mb-2 text-white/30" />
               <p className="text-sm font-medium">Aún no hay actividad.</p>
               <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Completa una sesión para verla aquí.</span>
             </div>
          )}
        </div>
      </div>

      <MediaModal 
        isOpen={!!fsMedia}
        url={fsMedia?.url || ''}
        title={fsMedia?.title || ''}
        onClose={() => setFsMedia(null)}
      />
    </div>
  );
};

export default Dashboard;
