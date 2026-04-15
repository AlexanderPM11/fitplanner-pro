import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Activity, Calendar, ChevronDown, Filter } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProgressData {
  date: string;
  weight: number;
  volume: number;
}

interface PRRecord {
  exercise_name: string;
  max_weight: number;
  date: string;
  category: string;
}

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [exerciseProgress, setExerciseProgress] = useState<ProgressData[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PRRecord[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all completed workout data with joins
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        id,
        name,
        started_at,
        completed_at,
        workout_exercises (
          exercise:exercises ( name, category ),
          sets ( weight, reps, completed )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_template', false)
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: true });

    if (error || !data) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
      return;
    }

    processVolumeData(data);
    processPRsAndExercises(data);
    setLoading(false);
  };

  const processVolumeData = (workouts: any[]) => {
    // Group volume by week
    const weeklyMap = new Map();
    
    workouts.forEach(workout => {
      const date = new Date(workout.started_at);
      const weekKey = format(startOfWeek(date), 'MMM d');
      
      let workoutVolume = 0;
      workout.workout_exercises.forEach((we: any) => {
        we.sets.forEach((s: any) => {
          if (s.completed && s.weight && s.reps) {
            workoutVolume += (s.weight * s.reps);
          }
        });
      });

      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + workoutVolume);
    });

    const formattedVolume = Array.from(weeklyMap).map(([name, volume]) => ({ name, volume }));
    setVolumeData(formattedVolume.slice(-8)); // Show last 8 weeks
  };

  const processPRsAndExercises = (workouts: any[]) => {
    const prMap = new Map<string, PRRecord>();
    const exerciseNames = new Set<string>();
    
    workouts.forEach(workout => {
      workout.workout_exercises.forEach((we: any) => {
        const exercise = Array.isArray(we.exercise) ? we.exercise[0] : we.exercise;
        if (!exercise) return;
        
        exerciseNames.add(exercise.name);
        
        we.sets.forEach((s: any) => {
          if (s.completed && s.weight) {
            const currentPR = prMap.get(exercise.name);
            if (!currentPR || s.weight > currentPR.max_weight) {
              prMap.set(exercise.name, {
                exercise_name: exercise.name,
                max_weight: s.weight,
                date: workout.started_at,
                category: exercise.category
              });
            }
          }
        });
      });
    });

    setExercises(Array.from(exerciseNames).sort());
    setPersonalRecords(Array.from(prMap.values()).sort((a, b) => b.max_weight - a.max_weight));
    
    // Default selected exercise
    if (exerciseNames.size > 0 && !selectedExercise) {
      const firstEx = Array.from(exerciseNames).sort()[0];
      setSelectedExercise(firstEx);
      updateExerciseChart(firstEx, workouts);
    }
  };

  const updateExerciseChart = (exName: string, workouts: any[]) => {
    const progress: ProgressData[] = [];
    
    workouts.forEach(workout => {
      let maxWeight = 0;
      let totalVolume = 0;
      let found = false;

      workout.workout_exercises.forEach((we: any) => {
        const exercise = Array.isArray(we.exercise) ? we.exercise[0] : we.exercise;
        if (exercise && exercise.name === exName) {
          found = true;
          we.sets.forEach((s: any) => {
            if (s.completed && s.weight) {
              maxWeight = Math.max(maxWeight, s.weight);
              totalVolume += (s.weight * (s.reps || 0));
            }
          });
        }
      });

      if (found && maxWeight > 0) {
        progress.push({
          date: format(new Date(workout.started_at), 'MMM d'),
          weight: maxWeight,
          volume: totalVolume
        });
      }
    });

    setExerciseProgress(progress.slice(-10));
  };

  const handleExerciseChange = (ex: string) => {
    setSelectedExercise(ex);
    // We need the data again or store it in state
    fetchAnalyticsData(); // Re-fetch or optimize by storing raw data
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Activity size={48} className="text-primary/20 mb-4" />
        <p className="text-white/20 font-black uppercase italic tracking-widest">Crunching Numbers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Helmet>
        <title>Analytics | FitPlanner Pro</title>
      </Helmet>

      <header>
        <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Performance Insights</h2>
        <h1 className="text-3xl font-black tracking-tight italic uppercase">Athlete Analytics</h1>
      </header>

      {/* Row 1: Weekly Volume */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-bold uppercase italic text-sm">Weekly Volume</h3>
            <p className="text-[10px] text-white/30 uppercase font-black">Total kg lifted per week</p>
          </div>
        </div>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 800 }} 
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                labelStyle={{ color: '#00c3c3', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
              />
              <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                {volumeData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === volumeData.length - 1 ? '#00c3c3' : '#00c3c330'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Row 2: Exercise Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="font-bold uppercase italic text-sm">Strength Evolution</h3>
              <p className="text-[10px] text-white/30 uppercase font-black">Max weight per session</p>
            </div>
          </div>
          <select 
            value={selectedExercise}
            onChange={(e) => handleExerciseChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase text-secondary outline-none focus:border-secondary/50"
          >
            {exercises.map(ex => <option key={ex} value={ex} className="bg-black">{ex}</option>)}
          </select>
        </div>

        <div className="h-[250px] w-full">
          {exerciseProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={exerciseProgress}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 800 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 800 }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  labelStyle={{ color: '#00f2ff', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#00f2ff" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-white/10 italic text-sm">
              Not enough data for this exercise Yet.
            </div>
          )}
        </div>
      </motion.div>

      {/* Row 3: Personal Records */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 ml-2">
          <Award size={18} className="text-yellow-500" />
          <h3 className="font-black italic uppercase tracking-tighter text-lg text-white">Hall of Fame (PRs)</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {personalRecords.length > 0 ? personalRecords.slice(0, 5).map((pr, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-4 flex items-center justify-between group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-yellow-500/50 group-hover:text-yellow-500 transition-colors">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="font-bold uppercase italic text-sm tracking-tight">{pr.exercise_name}</h4>
                  <p className="text-[9px] text-white/20 uppercase font-black">{pr.category} • {format(new Date(pr.date), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black italic text-primary">{pr.max_weight}</span>
                <span className="text-[10px] font-bold text-white/30 ml-1 uppercase">kg</span>
              </div>
            </motion.div>
          )) : (
            <div className="glass-card p-8 text-center text-white/10 italic">
              No PRs recorded. Keep training!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
