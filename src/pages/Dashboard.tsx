import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Activity, Dumbbell, Flame, Zap, Trophy, TrendingUp, Clock, Target, Loader2 } from 'lucide-react';
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
  const [streak, setStreak] = useState<number>(0);
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
      
      // 4. Calculate Streak (Consecutive weeks with workouts)
      const { data: allWorkouts } = await supabase
        .from('workouts')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('is_template', false)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (allWorkouts && allWorkouts.length > 0) {
        // Simple logic: session count in the last 30 days
        const oneDay = 24 * 60 * 60 * 1000;
        setStreak(allWorkouts.filter(w => {
          const d = new Date(w.completed_at);
          return (now.getTime() - d.getTime()) < (30 * oneDay);
        }).length);
      }
      
      setLoadingMetrics(false);
    }
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="space-y-8 max-w-lg mx-auto pb-10">
      <Helmet>
        <title>Inicio | FitPlanner Pro</title>
        <meta name="description" content="Visualiza tu progreso, volumen semanal y récords personales en tu tablero de FitPlanner Pro." />
      </Helmet>

      {/* Header with Dynamic Greeting */}
      <header className="flex justify-between items-center px-1">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{getGreeting()}</h2>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic flex items-baseline">
            {profile?.full_name?.split(' ')[0] || 'ATLETA'}
            <span className="text-primary ml-1">.</span>
          </h1>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <div className="relative w-14 h-14 rounded-2xl bg-surface border border-white/10 flex items-center justify-center text-primary font-black text-xl overflow-hidden shadow-2xl">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.charAt(0) || <Zap size={24} />
            )}
          </div>
        </motion.div>
      </header>

      {/* Stats Highlight Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl group-hover:bg-primary/10 transition-colors" />
          <div className="relative glass-card p-6 border-b-2 border-b-primary/30 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp size={48} className="text-primary" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Activity size={16} className="text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Volumen</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black italic tracking-tighter">
                {loadingMetrics ? '---' : weeklyVolume.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-white/20 uppercase">kg</span>
            </div>
            <p className="text-[9px] text-white/20 font-bold uppercase mt-2">Esta Semana</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-secondary/5 rounded-3xl blur-xl group-hover:bg-secondary/10 transition-colors" />
          <div className="relative glass-card p-6 border-b-2 border-b-secondary/30 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Flame size={48} className="text-secondary" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-secondary/10 rounded-xl">
                <Zap size={16} className="text-secondary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Intensidad</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black italic tracking-tighter">
                {loadingMetrics ? '---' : streak}
              </span>
              <span className="text-xs font-bold text-white/20 uppercase">Sesiones</span>
            </div>
            <p className="text-[9px] text-white/20 font-bold uppercase mt-2">Últimos 30 días</p>
          </div>
        </motion.div>
      </div>

      {/* Hero CTA - Training Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
        <div className="relative glass-card p-1 rounded-[2.5rem] overflow-hidden">
          <div className="bg-gradient-to-br from-white/[0.08] to-transparent p-7 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-4 text-center sm:text-left">
              <div>
                <div className="inline-flex items-center px-2 py-1 bg-primary/10 rounded-lg border border-primary/20 mb-3">
                  <Trophy size={10} className="text-primary mr-1.5" />
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-primary">Objetivo de Hoy</span>
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">
                  ¿Listo para la <span className="text-primary italic">Gloria</span>?
                </h3>
                <p className="text-white/40 text-xs font-medium max-w-[200px]">No cuentes los días, haz que los días cuenten.</p>
              </div>
              
              <Link 
                to="/routines"
                className="group/btn relative inline-flex items-center px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase italic tracking-widest text-[11px] overflow-hidden transition-all shadow-[0_10px_20px_rgba(0,242,255,0.2)] hover:shadow-primary/40 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                <Plus size={18} className="mr-2 stroke-[3]" />
                Comenzar Sesión
              </Link>
            </div>

            <div className="relative">
              <div className="w-32 h-32 rounded-full border-2 border-white/5 flex items-center justify-center relative shadow-inner overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                <Dumbbell className="text-primary/20 group-hover:text-primary/40 group-hover:rotate-12 transition-all duration-700" size={64} />
                
                {/* Minimalist Progress Circle Background */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="60" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-white/[0.02]" />
                  <circle cx="64" cy="64" r="60" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray="377" strokeDashoffset={377 * (1 - (weeklyWorkoutsCount / 5))} className="text-primary/40" />
                </svg>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-background/80 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl shadow-xl">
                 <div className="flex items-center gap-1.5 font-black italic uppercase text-[10px]">
                   <span className="text-primary">{weeklyWorkoutsCount}</span>
                   <span className="text-white/20 whitespace-nowrap">/ 5 Semanal</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity List */}
      <div className="space-y-5 px-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-primary/50" />
            <h4 className="font-black text-sm uppercase tracking-widest italic text-white/80">Actividad Reciente</h4>
          </div>
          <Link to="/history" className="group flex items-center text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors">
            Ver más
            <ChevronRight size={14} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {loadingMetrics ? (
              <div key="loading" className="glass-card p-10 flex items-center justify-center border-dashed border-white/5 bg-white/[0.01]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={24} className="text-primary animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Sincronizando...</span>
                </div>
              </div>
            ) : recentWorkouts.length > 0 ? (
              recentWorkouts.map((workout: RecentWorkout, index: number) => {
                let vol = 0;
                workout.workout_exercises?.forEach((we: DashboardWorkoutExercise) => {
                  we.sets?.forEach((set: DashboardWorkoutSet) => {
                    if (set.completed && set.weight && set.reps) {
                      vol += (set.weight * set.reps);
                    }
                  });
                });

                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    key={workout.id} 
                    className="glass-card p-4 flex items-center justify-between group hover:bg-white/[0.03] hover:border-white/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="flex -space-x-3 mr-5">
                        {workout.workout_exercises?.slice(0, 3).map((we: DashboardWorkoutExercise, idx: number) => (
                          <div 
                            key={idx} 
                            className="w-12 h-12 rounded-xl border-[3px] border-background bg-surface overflow-hidden shrink-0 hover:scale-110 hover:z-20 transition-all shadow-xl"
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
                                <img src={we.exercise.image_url} alt="ejercicio" className="w-full h-full object-cover" />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/5">
                                <Activity size={18} className="text-white/10" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div>
                        <h5 className="font-black italic uppercase tracking-tight text-white/90 leading-tight group-hover:text-primary transition-colors">{workout.name || 'Entrenamiento'}</h5>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-tighter">
                            <Clock size={10} />
                            {format(new Date(workout.started_at), "d MMM", { locale: es })}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-primary/60 uppercase tracking-tighter">
                            <Activity size={10} />
                            {vol.toLocaleString()}kg
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-secondary/60 uppercase tracking-tighter">
                            <Dumbbell size={10} />
                            {workout.workout_exercises.length} Ex.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl border border-white/5 opacity-40 group-hover:opacity-100 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                      <ChevronRight size={18} className="text-white group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-10 text-center opacity-40 border-dashed border-white/10"
              >
                 <Dumbbell size={32} className="mx-auto mb-3 text-white/20" />
                 <p className="text-xs font-black uppercase tracking-widest leading-loose">Aún no hay actividad</p>
                 <p className="text-[10px] font-medium text-white/30">Tus progresos aparecerán aquí.</p>
              </motion.div>
            )}
          </AnimatePresence>
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
