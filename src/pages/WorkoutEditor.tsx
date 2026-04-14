import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, ArrowLeft, Save } from 'lucide-react';
import type { Exercise } from '../types';
import ExercisePicker from '../components/workout/ExercisePicker';
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
      .sort((a: DBWorkoutExercise, b: DBWorkoutExercise) => a.order_index - b.order_index)
      .map((we: DBWorkoutExercise) => ({
        exercise: we.exercise,
        sets: we.sets.sort((a: DBSet, b: DBSet) => a.order_index - b.order_index).map((s: DBSet) => ({
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
    newExercises[exerciseIndex].sets[setIndex].completed = !newExercises[exerciseIndex].sets[setIndex].completed;
    setExercises(newExercises);
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
                <div className="p-4 bg-white/5 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    {ex.exercise.image_url && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10 group/media cursor-pointer relative">
                        {ex.exercise.image_url.includes('.mp4') ? (
                          <video src={ex.exercise.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={ex.exercise.image_url} alt={ex.exercise.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                    <div>
                      <h3 className="font-black italic uppercase tracking-tight text-primary">{ex.exercise.name}</h3>
                      <p className="text-[10px] text-white/30 uppercase font-bold">{ex.exercise.category}</p>
                    </div>
                  </div>
                  <button onClick={() => removeExercise(exIdx)} className="text-white/20 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {/* Reference Media Expanded (Optional/Hover or just visible) */}
                {/* Note: We keep it compact by default, but the thumbnail is there for reference */}
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
    </div>
  );
};

export default WorkoutEditor;
