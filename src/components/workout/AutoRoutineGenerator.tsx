import React, { useState } from 'react';
import { Sparkles, X, Loader2, Dumbbell, User } from 'lucide-react';
import type { Exercise } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { motion } from 'framer-motion';
import { backendGet } from '../../api/backend';

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
  { id: 'Abdomen', name: 'Abdomen', query: 'waist', icon: '🍫' },
];

const AutoRoutineGenerator: React.FC<AutoRoutineGeneratorProps> = ({ onGenerated, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const { showToast } = useNotification();

  const handleGenerate = async (muscle: (typeof MUSCLE_GROUPS)[0]) => {
    setSelectedMuscle(muscle.id);
    setLoading(true);

    {
      try {
        const available = await backendGet<Exercise[]>('/api/exercises');
        const normalized = muscle.name.toLowerCase();
        const matches = available.filter((exercise) => muscle.id === 'Full Body' || exercise.category.toLowerCase().includes(normalized)).slice(0, muscle.id === 'Full Body' ? 6 : 4);
        if (matches.length === 0) throw new Error('No hay ejercicios disponibles para ese grupo.');
        onGenerated(matches); showToast(`Rutina de ${muscle.name} generada con éxito`, 'success'); onClose();
      } catch (error) { showToast(error instanceof Error ? error.message : 'No se pudieron cargar ejercicios', 'error'); }
      setLoading(false); return;
    }

    setLoading(false);
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




