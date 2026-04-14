import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, ArrowLeft, Save, Dumbbell, Loader2, Timer, X as CloseIcon, RotateCcw, Volume2, Maximize2 } from 'lucide-react';
import type { Exercise } from '../types';
import ExercisePicker from '../components/workout/ExercisePicker';
import MediaModal from '../components/shared/MediaModal';
import { Helmet } from 'react-helmet-async';
import { useNotification } from '../context/NotificationContext';

interface WorkoutExerciseState {
  exercise: Exercise;
  sets: {
    weight: string;
    reps: string;
    completed: boolean;
  }[];
}

const WorkoutEditor = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('New Workout');
  const [exercises, setExercises] = useState<WorkoutExerciseState[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  const [expandedEx, setExpandedEx] = useState<number | null>(null);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  
  // Fullscreen Preview State
  const [fsMedia, setFsMedia] = useState<{ url: string; title: string } | null>(null);
  
  const [searchParams] = useSearchParams();
  const { showToast } = useNotification();

  useEffect(() => {
    const templateId = searchParams.get('templateId');
    const editId = searchParams.get('editId');
    
    if (editId) {
      loadWorkoutData(editId, true);
    } else if (templateId) {
      loadWorkoutData(templateId, false);
    }
  }, [searchParams]);

  // Timer Interval
  useEffect(() => {
    let interval: any;
    if (isTimerActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => (prev !== null && prev > 0) ? prev - 1 : 0);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      playTimerEndSound();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const playTimerEndSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play();
      
      // Haptic feedback if available
      if (window.navigator.vibrate) {
        window.navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  const loadWorkoutData = async (id: string, isEditing: boolean) => {
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('*, workout_exercises(*, exercise:exercises(*), sets(*))')
      .eq('id', id)
      .single();

    if (workoutError || !workout) {
      console.error('Error loading workout data:', workoutError);
      return;
    }

    setName(workout.name);
    setIsTemplate(workout.is_template);
    
    // If we are loading a template to START a workout, or cloning, we are logging a session
    if (!isEditing) {
      setIsTemplate(false);
    }

    interface DBSet { weight: number, reps: number, completed: boolean, order_index: number }
    interface DBWorkoutExercise { order_index: number, exercise: Exercise, sets: DBSet[] }

    const loadedExercises: WorkoutExerciseState[] = workout.workout_exercises
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((we: any) => ({
        exercise: Array.isArray(we.exercise) ? we.exercise[0] : we.exercise,
        sets: (we.sets || []).sort((a: DBSet, b: DBSet) => a.order_index - b.order_index).map((s: DBSet) => ({
          weight: s.weight ? s.weight.toString() : '',
          reps: s.reps ? s.reps.toString() : '',
          completed: s.completed
        }))
      }));

    setExercises(loadedExercises);
  };

  const addExercise = (exercise: Exercise) => {
    setExercises([...exercises, {
      exercise,
      sets: [{ weight: '', reps: '', completed: false }]
    }]);
    setShowPicker(false);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
    newExercises[exerciseIndex].sets.push({
      weight: lastSet?.weight || '',
      reps: lastSet?.reps || '',
      completed: false
    });
    setExercises(newExercises);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof WorkoutExerciseState['sets'][0], value: string | boolean) => {
    const newExercises = [...exercises];
    const set = newExercises[exerciseIndex].sets[setIndex];
    if (field === 'completed') {
      set.completed = value as boolean;
    } else if (field === 'weight') {
      set.weight = value as string;
    } else if (field === 'reps') {
      set.reps = value as string;
    }
    setExercises(newExercises);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    const isNowCompleted = !newExercises[exerciseIndex].sets[setIndex].completed;
    newExercises[exerciseIndex].sets[setIndex].completed = isNowCompleted;
    setExercises(newExercises);

    // Auto-trigger timer if completing a set
    if (isNowCompleted && !isTemplate) {
      startTimer();
    }
  };

  const startTimer = (seconds = timerDuration) => {
    setTimeLeft(seconds);
    setIsTimerActive(true);
  };

  const stopTimer = () => {
    setIsTimerActive(false);
    setTimeLeft(null);
  };

  const adjustTimer = (seconds: number) => {
    setTimeLeft(prev => (prev !== null ? Math.max(0, prev + seconds) : seconds));
    if (!isTimerActive) setIsTimerActive(true);
  };

  const saveWorkout = async () => {
    if (exercises.length === 0) return;
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const editId = searchParams.get('editId');
      let workoutId = editId;

      // 1. Create or Update Workout
      if (editId) {
        const { error: updateError } = await supabase
          .from('workouts')
          .update({
            name,
            is_template: isTemplate,
            completed_at: isTemplate ? null : new Date().toISOString()
          })
          .eq('id', editId);
        
        if (updateError) throw updateError;

        // Delete existing exercises/sets to re-insert updated ones (cleanest way to handle adds/removes)
        const { error: deleteError } = await supabase
          .from('workout_exercises')
          .delete()
          .eq('workout_id', editId);
        
        if (deleteError) throw deleteError;
      } else {
        const { data: newWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            name,
            started_at: new Date().toISOString(),
            completed_at: isTemplate ? null : new Date().toISOString(),
            is_template: isTemplate
          })
          .select()
          .single();

        if (workoutError) throw workoutError;
        workoutId = newWorkout.id;
      }

      // 2. Create Workout Exercises and Sets
      for (let i = 0; i < exercises.length; i++) {
        const { data: we, error: weError } = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutId,
            exercise_id: exercises[i].exercise.id,
            order_index: i
          })
          .select()
          .single();

        if (weError) throw weError;

        const setsToInsert = exercises[i].sets.map((set, setIndex) => ({
          workout_exercise_id: we.id,
          weight: parseFloat(set.weight) || 0,
          reps: parseInt(set.reps) || 0,
          completed: set.completed,
          order_index: setIndex
        }));

        const { error: setsError } = await supabase
          .from('sets')
          .insert(setsToInsert);

        if (setsError) throw setsError;
      }

      showToast(isTemplate ? 'Routine saved successfully' : 'Workout saved successfully', 'success');
      navigate('/');
    } catch (err) {
      console.error(err);
      showToast('Error saving workout', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <Helmet>
        <title>{name} | FitPlanner Pro</title>
        <meta name="description" content="Registra tus ejercicios, series y repeticiones. Controla tu progreso en tiempo real." />
      </Helmet>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 glass-card rounded-none border-t-0 p-4 z-40 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1">
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isTemplate ? "Routine Name (e.g. Leg Day)" : "Workout Name"}
            className="w-full bg-transparent text-center font-black italic uppercase tracking-tighter outline-none focus:text-primary"
            aria-label={isTemplate ? "Nombre de la rutina" : "Nombre del entrenamiento"}
          />
        </h1>
        <div className="flex items-center space-x-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setIsTemplate(false)}
              className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${!isTemplate ? 'bg-primary text-black shadow-lg' : 'text-white/30 hover:text-white/50'}`}
            >
              Session
            </button>
            <button 
              onClick={() => setIsTemplate(true)}
              className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${isTemplate ? 'bg-primary text-black shadow-lg' : 'text-white/30 hover:text-white/50'}`}
            >
              Routine
            </button>
          </div>
          <button 
            onClick={saveWorkout} 
            disabled={saving || exercises.length === 0}
            className={`p-2.5 rounded-xl bg-primary text-black hover:scale-105 active:scale-95 transition-all shadow-lg ${saving ? 'animate-pulse' : ''}`}
            title="Save changes"
          >
            <Save size={20} />
          </button>
        </div>
      </div>

      <div className="pt-20 px-4 space-y-6 max-w-lg mx-auto">
        <AnimatePresence>
          {exercises.map((ex, exIdx) => (
            <motion.div 
              key={exIdx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card overflow-hidden"
            >
              <div className="flex flex-col">
                <div 
                  className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => setExpandedEx(expandedEx === exIdx ? null : exIdx)}
                >
                  <div className="flex items-center space-x-3">
                    {ex.exercise.image_url ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10 relative group/media">
                        {ex.exercise.image_url.includes('.mp4') || ex.exercise.image_url.includes('.webm') ? (
                          <video src={ex.exercise.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={ex.exercise.image_url} alt={ex.exercise.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl shrink-0 bg-white/5 border border-white/10 flex items-center justify-center text-white/10">
                        <Dumbbell size={20} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-black italic uppercase tracking-tight text-primary leading-tight">{ex.exercise.name}</h3>
                      <p className="text-[10px] text-white/30 uppercase font-bold">{ex.exercise.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExercise(exIdx);
                      }} 
                      className="p-2 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Large Media Preview (Expanded) */}
                <AnimatePresence>
                  {expandedEx === exIdx && ex.exercise.image_url && (
                    <motion.div
                      key={`expanded-${exIdx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="overflow-hidden bg-black/60 border-y border-white/5"
                    >
                      <div 
                        className="aspect-video w-full relative flex items-center justify-center bg-black/20 cursor-expand hover:bg-black/30 transition-all group/expand"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFsMedia({ url: ex.exercise.image_url!, title: ex.exercise.name });
                        }}
                      >
                        {/* Loading State */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 size={24} className="text-primary/20 animate-spin" />
                        </div>
                        
                        <div className="absolute inset-0 z-20 opacity-0 group-hover/expand:opacity-100 transition-opacity flex items-center justify-center bg-black/40">
                          <div className="flex flex-col items-center space-y-2">
                            <Maximize2 size={24} className="text-primary" />
                            <span className="text-[10px] font-black uppercase text-white">Pantalla Completa</span>
                          </div>
                        </div>

                        {/* Video detection: Check for .mp4, .webm or common video/gif patterns from ExerciseDB */}
                        {(ex.exercise.image_url.includes('.mp4') || 
                          ex.exercise.image_url.includes('.webm') || 
                          ex.exercise.image_url.includes('video') ||
                          ex.exercise.image_url.includes('giphy')) ? (
                          <video 
                            src={ex.exercise.image_url} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            controls
                            className="relative z-10 w-full h-full object-contain"
                            onError={(e) => {
                              // If video fails, try rendering as image (fallback for GIFs that might be misidentified)
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const img = document.createElement('img');
                                img.src = ex.exercise.image_url!;
                                img.className = 'w-full h-full object-contain relative z-10';
                                parent.appendChild(img);
                              }
                            }}
                          />
                        ) : (
                          <img 
                            src={ex.exercise.image_url} 
                            alt={ex.exercise.name} 
                            className="relative z-10 w-full h-full object-contain" 
                          />
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent z-20">
                          <p className="text-[10px] font-black italic uppercase tracking-widest text-primary flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span>Guía de Movimiento</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-4 space-y-2">
                <div className="grid grid-cols-4 gap-2 text-[10px] uppercase font-bold text-white/30 mb-1 px-2">
                  <div className="text-center">Set</div>
                  <div className="text-center">kg</div>
                  <div className="text-center">Reps</div>
                  <div className="text-center">Done</div>
                </div>

                {ex.sets.map((set, setIdx) => (
                  <div key={setIdx} className={`grid grid-cols-4 gap-2 items-center p-2 rounded-lg transition-colors ${set.completed ? 'bg-primary/5' : 'bg-white/5'}`}>
                    <div className="text-center font-bold italic text-white/30">{setIdx + 1}</div>
                    <input
                      type="number"
                      placeholder="0"
                      className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-center outline-none focus:border-primary/50"
                      value={set.weight}
                      onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="0"
                      className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-center outline-none focus:border-primary/50"
                      value={set.reps}
                      onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                    />
                    <button 
                      onClick={() => toggleSetComplete(exIdx, setIdx)}
                      className={`flex justify-center p-1 rounded-lg transition-all ${set.completed ? 'bg-primary text-black' : 'bg-white/5 text-white/20'}`}
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ))}

                <button 
                  onClick={() => addSet(exIdx)}
                  className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white/30 hover:bg-white/10 transition-colors"
                >
                  + Add Set
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button 
          onClick={() => setShowPicker(true)}
          className="w-full glass-card p-6 border-dashed border-primary/30 flex flex-col items-center justify-center space-y-2 text-primary hover:bg-primary/5 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus size={24} />
          </div>
          <span className="font-bold uppercase tracking-tighter italic">Add Exercise</span>
        </button>
      </div>

      {showPicker && (
        <ExercisePicker 
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Fullscreen Media Modal */}
      <MediaModal 
        isOpen={!!fsMedia}
        url={fsMedia?.url || ''}
        title={fsMedia?.title || ''}
        onClose={() => setFsMedia(null)}
      />

      {/* Floating Rest Timer Component */}
      <AnimatePresence>
        {timeLeft !== null && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-50 flex justify-center"
          >
            <div className="glass-card shadow-2xl border-primary/20 bg-black/80 backdrop-blur-2xl px-6 py-4 flex items-center space-x-6 min-w-[300px] justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-white/5 flex items-center justify-center">
                    <Timer className={isTimerActive ? "text-primary animate-pulse" : "text-white/20"} size={24} />
                  </div>
                  {/* Simple Progress Ring effect */}
                  <svg className="absolute inset-0 w-12 h-12 -rotate-90">
                    <circle 
                      cx="24" cy="24" r="22" 
                      fill="transparent" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      className="text-primary transition-all duration-1000"
                      strokeDasharray={138}
                      strokeDashoffset={138 - (138 * (timeLeft / timerDuration))}
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Descanso</p>
                  <p className="text-2xl font-black italic tracking-tighter tabular-nums text-white">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => adjustTimer(30)}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-[10px] font-bold"
                >
                  +30s
                </button>
                <button 
                  onClick={stopTimer}
                  className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutEditor;
