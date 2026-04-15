import React, { useState } from 'react';
import { supabase } from '../../api/supabase';
import { Sparkles, X, Loader2, Dumbbell, User } from 'lucide-react';
import type { Exercise } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AutoRoutineGeneratorProps {
  onGenerated: (exercises: Exercise[]) => void;
  onClose: () => void;
}

const MUSCLE_GROUPS = [
  { id: 'Full Body', name: 'Cuerpo Completo', query: 'compound', icon: '🌎' },
  { id: 'Pecho', name: 'Pecho', query: 'chest', icon: '🥊' },
  { id: 'Espalda', name: 'Espalda', query: 'back', icon: '🧗' },
  { id: 'Piernas', name: 'Piernas', query: 'legs', icon: '🦵' },
  { id: 'Hombros', name: 'Hombros', query: 'shoulders', icon: '🏗️' },
  { id: 'Brazos', name: 'Brazos', query: 'arms', icon: '💪' },
  { id: 'Glúteos', name: 'Glúteos', query: 'glute', icon: '🍑' },
  { id: 'Core', name: 'Core', query: 'abs', icon: '🧘' },
];

const AutoRoutineGenerator: React.FC<AutoRoutineGeneratorProps> = ({ onGenerated, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const { showToast } = useNotification();

  const handleGenerate = async (muscle: (typeof MUSCLE_GROUPS)[0]) => {
    setSelectedMuscle(muscle.id);
    setLoading(true);

    const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
    if (!apiKey) {
      showToast('Falta configurar VITE_RAPIDAPI_KEY', 'error');
      setLoading(false);
      return;
    }

    try {
      let apiExercises: any[] = [];

      if (muscle.id === 'Full Body') {
        // Special logic for Full Body: Fetch from multiple key categories
        const categories = [
          { q: 'legs', count: 2 },
          { q: 'back', count: 2 },
          { q: 'chest', count: 2 },
          { q: 'glute', count: 1 },
          { q: 'shoulders', count: 1 },
          { q: 'arms', count: 1 },
          { q: 'abs', count: 1 }
        ];

        const results = await Promise.all(
          categories.map(cat => 
            fetch(`https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/search?search=${encodeURIComponent(cat.q)}`, {
              method: 'GET',
              headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'
              }
            }).then(r => r.json())
          )
        );

        results.forEach((res, idx) => {
          if (res.success && Array.isArray(res.data)) {
            apiExercises.push(...res.data.slice(0, categories[idx].count));
          }
        });
      } else {
        // Single category fetch
        const response = await fetch(`https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/search?search=${encodeURIComponent(muscle.query)}`, {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'
          }
        });
        const res = await response.json();
        
        if (res.success && Array.isArray(res.data)) {
          apiExercises = res.data.slice(0, 10);
        }
      }

      if (apiExercises.length === 0) {
        throw new Error('No se pudieron obtener ejercicios');
      }

      // SECONDARY FETCH: Get full details for each exercise to get videoUrl
      const enrichedExercises = await Promise.all(
        apiExercises.map(async (ex) => {
          try {
            const detailResponse = await fetch(`https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/${ex.exerciseId}`, {
              method: 'GET',
              headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'
              }
            });
            const detailRes = await detailResponse.json();
            return detailRes.success ? detailRes.data : ex;
          } catch (e) {
            console.error('Error fetching details for', ex.exerciseId, e);
            return ex;
          }
        })
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const finalExercises: Exercise[] = [];

      for (const apiEx of enrichedExercises) {
        const displayName = apiEx.name.charAt(0).toUpperCase() + apiEx.name.slice(1);

        // Standardize data object for both insert and update
        const exerciseData = {
          name: displayName,
          category: apiEx.bodyPart || muscle.id,
          user_id: user.id,
          image_url: apiEx.imageUrl,
          video_url: apiEx.videoUrl || null,
          description: apiEx.overview || null,
          instructions: apiEx.instructions || null,
          tips: apiEx.exerciseTips || null,
          difficulty: apiEx.difficultyLevel || null,
          male_activation_url: apiEx.maleMuscleActivationUrl || null,
          female_activation_url: apiEx.femaleMuscleActivationUrl || null,
          gender: gender
        };

        // UPSERT: Create if doesn't exist, update if it does (matching by name and user_id)
        const { data: syncedEx, error: syncError } = await supabase
          .from('exercises')
          .upsert(exerciseData, { 
            onConflict: 'name,user_id',
            ignoreDuplicates: false // We WANT to overwrite with new API data
          })
          .select()
          .single();

        if (!syncError && syncedEx) {
          finalExercises.push(syncedEx);
        } else {
          console.error('Error syncing exercise:', syncError);
        }
      }

      if (finalExercises.length > 0) {
        showToast(`¡Rutina de ${muscle.name} generada con éxito!`, 'success');
        onGenerated(finalExercises);
      } else {
        showToast('No se pudieron procesar los ejercicios', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Error al auto-generar la rutina', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="glass-card w-full max-w-lg p-6 relative z-10 overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3 text-primary">
            <Sparkles size={24} className="animate-pulse" />
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Auto-Generar AI</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Gender Selector */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-6">
          <button
            onClick={() => setGender('male')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all
              ${gender === 'male' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
          >
            <User size={14} fill={gender === 'male' ? 'currentColor' : 'none'} />
            <span>Hombre</span>
          </button>
          <button
            onClick={() => setGender('female')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all
              ${gender === 'female' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}
          >
            <User size={14} fill={gender === 'female' ? 'currentColor' : 'none'} />
            <span>Mujer</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {MUSCLE_GROUPS.map((muscle) => (
            <button
              key={muscle.id}
              onClick={() => handleGenerate(muscle)}
              disabled={loading}
              className={`relative h-24 rounded-3xl border transition-all overflow-hidden group flex flex-col items-center justify-center space-y-2
                ${selectedMuscle === muscle.id 
                  ? 'border-primary bg-primary/20 scale-[0.98]' 
                  : 'border-white/10 bg-white/5 hover:border-primary/50 hover:bg-white/10 active:scale-95'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading && selectedMuscle === muscle.id ? (
                <Loader2 className="animate-spin text-primary" size={24} />
              ) : (
                <>
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-500">{muscle.icon}</span>
                  <span className="text-xs font-black uppercase tracking-widest italic">{muscle.name}</span>
                </>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white/5 rounded-2xl p-4 border border-primary/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Dumbbell size={40} className="-rotate-12" />
          </div>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed text-center relative z-10">
            Ahora generamos <span className="text-primary">10 ejercicios</span> de alta calidad. 
            {selectedMuscle === 'Full Body' ? ' Mezcla equilibrada de todos los grupos musculares.' : ' Enfocados intensamente en tu selección.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AutoRoutineGenerator;
