import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Activity, Clock, Dumbbell, Calendar, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell, LineChart, Line
} from 'recharts';
import { format, startOfWeek } from 'date-fns';
import { backendGet } from '../api/backend';

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

interface AnalyticsProps {
  hideHeader?: boolean;
}

const Analytics: React.FC<AnalyticsProps> = ({ hideHeader = false }) => {
  const [loading, setLoading] = useState(true);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [exerciseProgress, setExerciseProgress] = useState<ProgressData[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PRRecord[]>([]);

  // New metrics and charts states
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    totalHours: '0.0',
    avgDuration: 0,
  });
  const [muscleData, setMuscleData] = useState<any[]>([]);
  const [daysData, setDaysData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAnalyticsData() {
      setLoading(true);
      try {
        const apiData = await backendGet<Array<{ name: string; startedAtUtc: string; completedAtUtc: string | null; exercises: Array<{ exerciseName: string | null; category: string | null; sets: Array<{ weight: number | null; reps: number | null; completed: boolean }> }> }>>('/api/workouts?templates=false');
        const data = apiData.filter((item) => item.completedAtUtc).map((item) => ({ name: item.name, started_at: item.startedAtUtc, completed_at: item.completedAtUtc, workout_exercises: item.exercises.map((exercise) => ({ exercise: { name: exercise.exerciseName, category: exercise.category }, sets: exercise.sets })) }));
        processVolumeData(data);
        processPRsAndExercises(data);
        calculateStatsAndNewCharts(data);
      } catch { /* Keep the analytics empty state when the API is unavailable. */ }
      setLoading(false);
    }
    fetchAnalyticsData();
  }, []);

  const calculateStatsAndNewCharts = (workouts: any[]) => {
    // 1. Stats
    let totalVolume = 0;
    let totalDurationMs = 0;
    let durationCount = 0;

    workouts.forEach(w => {
      // Total volume
      w.workout_exercises.forEach((we: any) => {
        we.sets.forEach((s: any) => {
          if (s.completed && s.weight && s.reps) {
            totalVolume += (s.weight * s.reps);
          }
        });
      });

      // Total time
      if (w.completed_at && w.started_at) {
        const diff = new Date(w.completed_at).getTime() - new Date(w.started_at).getTime();
        const diffMins = diff / (1000 * 60);
        if (diffMins >= 5 && diffMins <= 240) {
          totalDurationMs += diff;
          durationCount++;
        }
      }
    });

    const totalHours = (totalDurationMs / (1000 * 60 * 60)).toFixed(1);
    const avgDuration = durationCount > 0 ? Math.round((totalDurationMs / durationCount) / (1000 * 60)) : 0;

    setStats({
      totalWorkouts: workouts.length,
      totalVolume,
      totalHours,
      avgDuration
    });

    // 2. Muscle Group Distribution (completed sets by category)
    const categorySetsMap = new Map<string, number>();
    const SPANISH_CATEGORIES: Record<string, string> = {
      'BACK': 'Espalda',
      'CALVES': 'Pantorrillas',
      'CHEST': 'Pecho',
      'FOREARMS': 'Antebrazos',
      'HIPS': 'Caderas',
      'NECK': 'Cuello',
      'SHOULDERS': 'Hombros',
      'THIGHS': 'Muslos',
      'WAIST': 'Abdomen',
      'HANDS': 'Manos',
      'FEET': 'Pies',
      'FACE': 'Cara',
      'FULL BODY': 'Cuerpo Completo',
      'BICEPS': 'Bíceps',
      'UPPER ARMS': 'Brazos',
      'TRICEPS': 'Tríceps',
      'HAMSTRINGS': 'Isquiotibiales',
      'QUADRICEPS': 'Cuádriceps'
    };

    workouts.forEach(workout => {
      workout.workout_exercises.forEach((we: any) => {
        const exercise = Array.isArray(we.exercise) ? we.exercise[0] : we.exercise;
        if (!exercise) return;
        
        let completedSets = 0;
        we.sets.forEach((s: any) => {
          if (s.completed) completedSets++;
        });
        
        if (completedSets > 0) {
          const rawCat = exercise.category ? exercise.category.toUpperCase() : 'OTROS';
          const catName = SPANISH_CATEGORIES[rawCat] || rawCat;
          categorySetsMap.set(catName, (categorySetsMap.get(catName) || 0) + completedSets);
        }
      });
    });

    const formattedMuscle = Array.from(categorySetsMap)
      .map(([name, sets]) => ({ name, sets }))
      .sort((a, b) => b.sets - a.sets)
      .slice(0, 6);
    setMuscleData(formattedMuscle);

    // 3. Days Active
    const daysMap = [0, 0, 0, 0, 0, 0, 0];
    workouts.forEach(workout => {
      if (workout.started_at) {
        const date = new Date(workout.started_at);
        let day = date.getDay();
        const index = day === 0 ? 6 : day - 1;
        daysMap[index]++;
      }
    });
    
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const formattedDays = dayNames.map((name, i) => ({
      name,
      count: daysMap[i]
    }));
    setDaysData(formattedDays);

    // 4. Monthly Workout Frequency
    const monthlyMap = new Map<string, number>();
    workouts.forEach(workout => {
      if (workout.started_at) {
        const date = new Date(workout.started_at);
        const monthKey = format(date, 'MMM yy');
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
      }
    });
    
    const formattedMonthly = Array.from(monthlyMap)
      .map(([name, count]) => ({ name, count }))
      .slice(-6);
    setMonthlyData(formattedMonthly);
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
        <title>Métricas | FitPlanner Pro</title>
      </Helmet>

      {!hideHeader && (
        <header>
          <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Desempeño y Métricas</h2>
          <h1 className="text-3xl font-black tracking-tight italic uppercase">Estadísticas de Atleta</h1>
        </header>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Workouts */}
        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Dumbbell size={16} />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase font-black">Sesiones</p>
            <h4 className="text-xl font-black italic">{stats.totalWorkouts}</h4>
          </div>
        </div>

        {/* Total Volume */}
        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
            <Activity size={16} />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase font-black">Vol. Total</p>
            <h4 className="text-xl font-black italic">
              {stats.totalVolume >= 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}k` : stats.totalVolume}
              <span className="text-[10px] font-bold text-white/30 ml-0.5 uppercase">kg</span>
            </h4>
          </div>
        </div>

        {/* Total Time */}
        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase font-black">Tiempo</p>
            <h4 className="text-xl font-black italic">{stats.totalHours}h</h4>
          </div>
        </div>

        {/* Avg Duration */}
        <div className="glass-card p-4 flex items-center space-x-3">
          <div className="p-2 bg-green-500/10 rounded-xl text-green-500">
            <Zap size={16} />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase font-black">Promedio</p>
            <h4 className="text-xl font-black italic">{stats.avgDuration}m</h4>
          </div>
        </div>
      </div>

      {/* Muscle Group Distribution */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Dumbbell size={20} />
          </div>
          <div>
            <h3 className="font-bold uppercase italic text-sm">Grupos Musculares</h3>
            <p className="text-[10px] text-white/30 uppercase font-black">Series completadas por grupo</p>
          </div>
        </div>
        
        <div className="h-[200px] w-full">
          {muscleData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={muscleData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff50', fontSize: 10, fontWeight: 800 }} 
                  width={90}
                />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="sets" radius={[0, 4, 4, 0]}>
                  {muscleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00c3c3' : '#00c3c340'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-white/10 italic text-sm">
              Sin datos de series completadas.
            </div>
          )}
        </div>
      </motion.div>

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
            <h3 className="font-bold uppercase italic text-sm">Volumen Semanal</h3>
            <p className="text-[10px] text-white/30 uppercase font-black">Total kg levantados por semana</p>
          </div>
        </div>
        
        <div className="h-[200px] w-full">
          {volumeData.length > 0 ? (
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
          ) : (
            <div className="h-full flex items-center justify-center text-white/10 italic text-sm">
              Sin suficientes entrenamientos completados aún.
            </div>
          )}
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
              <h3 className="font-bold uppercase italic text-sm">Evolución de Fuerza</h3>
              <p className="text-[10px] text-white/30 uppercase font-black">Peso máximo por sesión</p>
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
              Sin datos suficientes para este ejercicio.
            </div>
          )}
        </div>
      </motion.div>

      {/* Consistency Day by Day */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="font-bold uppercase italic text-sm">Frecuencia por Día</h3>
            <p className="text-[10px] text-white/30 uppercase font-black">Entrenamientos por día de la semana</p>
          </div>
        </div>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daysData}>
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
              />
              <Bar dataKey="count" fill="#00f2ff" radius={[4, 4, 0, 0]}>
                {daysData.map((d, index) => (
                  <Cell key={`cell-${index}`} fill={d.count > 0 ? '#00f2ff' : '#ffffff05'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly Frequency Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-bold uppercase italic text-sm">Frecuencia Mensual</h3>
            <p className="text-[10px] text-white/30 uppercase font-black">Sesiones completadas por mes</p>
          </div>
        </div>
        
        <div className="h-[200px] w-full">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 800 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 800 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#ffb700" 
                  strokeWidth={3} 
                  dot={{ fill: '#ffb700', stroke: '#000', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-white/10 italic text-sm">
              Sin datos mensuales suficientes.
            </div>
          )}
        </div>
      </motion.div>

      {/* Row 3: Personal Records */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 ml-2">
          <Award size={18} className="text-yellow-500" />
          <h3 className="font-black italic uppercase tracking-tighter text-lg text-white">Salón de la Fama (Récords PRs)</h3>
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
                  <p className="text-[9px] text-white/20 uppercase font-black">{pr.category} • {format(new Date(pr.date), 'd MMM, yyyy')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black italic text-primary">{pr.max_weight}</span>
                <span className="text-[10px] font-bold text-white/30 ml-1 uppercase">kg</span>
              </div>
            </motion.div>
          )) : (
            <div className="glass-card p-8 text-center text-white/10 italic">
              No se han registrado récords aún. ¡Sigue entrenando!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
