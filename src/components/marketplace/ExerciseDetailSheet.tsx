import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Heart, Activity, Info } from 'lucide-react';
import type { Exercise } from '../../types';
import { supabase } from '../../api/supabase';
import { useNotification } from '../../context/NotificationContext';

interface ExerciseDetailSheetProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (exercise: Exercise) => void;
  mode: 'add' | 'replace';
}

const ExerciseDetailSheet: React.FC<ExerciseDetailSheetProps> = ({ exercise, isOpen, onClose, onAction, mode }) => {
  const { showToast } = useNotification();
  const [isPlaying, setIsPlaying] = useState(true);

  if (!exercise) return null;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      if (exercise.is_favorite) {
        await supabase.from('favorite_exercises').delete().eq('user_id', user.id).eq('exercise_id', exercise.id);
        exercise.is_favorite = false;
        showToast('Eliminado de favoritos', 'info');
      } else {
        await supabase.from('favorite_exercises').insert({ user_id: user.id, exercise_id: exercise.id });
        exercise.is_favorite = true;
        showToast('Añadido a favoritos', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Error al actualizar favorito', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[80] h-[85vh] bg-[#0A0A0A] rounded-t-[2.5rem] border-t border-white/10 flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
          >
            {/* Handle Bar */}
            <div className="absolute top-0 w-full flex justify-center py-4 z-20" onClick={onClose}>
              <div className="w-12 h-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors shadow-lg cursor-pointer" />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 relative">
              {/* Media Section */}
              <div className="relative w-full aspect-[4/3] bg-[#050505]">
                {exercise.video_url || (exercise.image_url && exercise.image_url.includes('.mp4')) ? (
                   <video 
                     src={exercise.video_url || exercise.image_url!} 
                     autoPlay={isPlaying} 
                     loop 
                     muted 
                     playsInline 
                     className="w-full h-full object-cover opacity-80" 
                     onClick={() => setIsPlaying(!isPlaying)}
                   />
                ) : (
                  <img src={exercise.image_url || ''} alt={exercise.name} className="w-full h-full object-cover opacity-80" />
                )}
                
                {/* Visual Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/50 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute top-10 right-4 flex flex-col gap-2 z-10">
                  <button onClick={toggleFavorite} className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${exercise.is_favorite ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-black/40 border-white/10 text-white/40 hover:text-white'}`}>
                    <Heart size={16} fill={exercise.is_favorite ? "currentColor" : "none"} />
                  </button>
                  <button onClick={onClose} className="w-10 h-10 rounded-full backdrop-blur-xl border border-white/10 bg-black/40 flex items-center justify-center text-white/40 hover:text-white transition-all">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Data Section */}
              <div className="p-6 space-y-8 -mt-10 relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20 shadow-[0_0_10px_rgba(0,242,255,0.1)]">{exercise.category}</span>
                    {exercise.equipment && <span className="text-[9px] font-black uppercase tracking-widest text-white/50 bg-white/5 px-2 py-1 rounded-md border border-white/5">{exercise.equipment}</span>}
                  </div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-tight">{exercise.name}</h2>
                </div>

                {/* Biomechanics Mini Radar */}
                {(exercise.male_activation_url || exercise.female_activation_url) && (
                  <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-4 flex gap-5 items-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50" />
                    
                    <div className="w-16 h-16 bg-black/80 rounded-2xl flex flex-col items-center justify-center p-2 border border-white/10 shadow-inner z-10">
                      <img src={exercise.gender === 'female' ? exercise.female_activation_url! : exercise.male_activation_url!} alt="Anatomy" className="h-full object-contain filter contrast-125" />
                    </div>
                    <div className="z-10">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 mb-1"><Activity size={12} /> Análisis Muscular</h4>
                      <p className="text-[10px] text-white/40 leading-relaxed max-w-[200px]">Activación detectada. Dificultad técnica: <strong className="text-white/80">{exercise.difficulty || 'Óptima'}</strong>.</p>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {(exercise.instructions && exercise.instructions.length > 0) && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-5 flex items-center gap-2">
                      <Info size={14} className="text-white/20" /> Breakdown de Ejecución
                    </h4>
                    <div className="space-y-4 relative before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-white/[0.03]">
                      {exercise.instructions.map((step, idx) => (
                        <div key={idx} className="flex gap-4 items-start relative">
                          <div className="w-6 h-6 rounded-full bg-[#0A0A0A] border border-white/10 flex items-center justify-center text-[9px] font-black italic text-white/50 shrink-0 mt-0 z-10 shadow-xl">{idx + 1}</div>
                          <p className="text-xs text-white/60 leading-relaxed pt-0.5">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent pt-12 pb-8 z-30">
              <button 
                onClick={() => {
                  onAction(exercise);
                  onClose();
                }}
                className={`w-full py-4 text-xs font-black italic uppercase tracking-[0.25em] rounded-2xl flex items-center justify-center gap-3 transition-all ${mode === 'replace' ? 'bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:scale-[1.02]' : 'bg-primary text-black hover:bg-primary/90 shadow-[0_0_40px_rgba(0,242,255,0.2)] hover:scale-[1.02]'}`}
              >
                {mode === 'replace' ? 'Reemplazar en Rutina' : 'Añadir Ejercicio'}
                <Check size={18} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExerciseDetailSheet;
