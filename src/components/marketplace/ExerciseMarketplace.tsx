import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { X, Loader2, ChevronRight, LayoutGrid } from 'lucide-react';
import type { Exercise } from '../../types';
import ExerciseDetailSheet from './ExerciseDetailSheet';

const CATEGORIES = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Glúteos', 'Abdomen', 'Core', 'Cardio', 'Full Body'];

interface ExerciseMarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  mode?: 'add' | 'replace';
}

const ExerciseMarketplace: React.FC<ExerciseMarketplaceProps> = ({ isOpen, onClose, onSelect, mode = 'add' }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [fetchingDetailsId, setFetchingDetailsId] = useState<string | null>(null);
  
  // Details Sheet
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // External API
  // showToast is kept if needed later, but removing for build compliance if unused


  useEffect(() => {
    if (isOpen) fetchExercisesCategory(activeCategory);
  }, [isOpen, activeCategory]);

  const fetchExercisesCategory = async (category: string) => {
    setLoading(true);
    setExercises([]); // Reset state immediately to avoid showing stale results
    
    // Mapeo extendido para cubrir todas las posibilidades del API
    const catMap: Record<string, string[]> = {
      'Pecho': ['chest'],
      'Espalda': ['back', 'upper back', 'lower back'],
      'Piernas': ['upper legs', 'lower legs', 'quads', 'hamstrings', 'calves', 'glutes', 'hips'],
      'Hombros': ['shoulders'],
      'Brazos': ['upper arms', 'lower arms', 'biceps', 'triceps', 'forearms'],
      'Glúteos': ['glutes', 'hips'],
      'Abdomen': ['waist', 'upper abs', 'lower abs', 'abs'],
      'Core': ['abs', 'obliques'],
      'Cardio': ['cardio'],
      'Full Body': ['full body', 'cardio']
    };

    const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
    if (!apiKey) {
      setLoading(false);
      return;
    }

    // Invertimos el mapa para el mapeo de vuelta (muchos a uno)
    const reverseMap: Record<string, string> = {};
    Object.entries(catMap).forEach(([spanish, apiTerms]) => {
      apiTerms.forEach(term => {
        reverseMap[term.toLowerCase()] = spanish;
      });
    });

    try {
      // 1. Intentar cargar desde el caché local (Supabase)
      let query = supabase.from('exercises').select('*').limit(200);
      if (category !== 'Todos') {
        query = query.eq('category', category);
      }
      
      const { data: localData } = await query.order('name');
      
      if (localData && localData.length > 0) {
        setExercises(localData);
        setLoading(false);
        return;
      }

      const targetCount = 200;
      let allStubs: any[] = [];
      let offset = 0;
      let hasMore = true;

      // Si es una categoría específica, obtenemos los términos del mapa
      const searchTerms = (category === 'Todos') ? [null] : (catMap[category] || [category]);

      while (allStubs.length < targetCount && hasMore) {
        // Para simplificar, si hay múltiples términos, los buscamos uno por uno o usamos el primero
        // Aquí usaremos el primer término para la búsqueda principal si hay muchos, 
        // o repetiremos el bucle si necesitamos más.
        for (const term of searchTerms) {
          let url = `https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises?limit=30&offset=${offset}`;
          if (term) {
            url += `&bodyParts=${term}`;
          }

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'x-rapidapi-key': apiKey,
              'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'
            }
          });
          const res = await response.json();
          
          if (res.data && res.data.length > 0) {
            const pageStubs = res.data.map((apiEx: any) => {
              const apiBodyPart = apiEx.bodyParts?.[0]?.toLowerCase();
              let mappedCategory = reverseMap[apiBodyPart];
              
              if (!mappedCategory && category !== 'Todos') {
                mappedCategory = category;
              }
              
              if (!mappedCategory) {
                mappedCategory = apiEx.bodyParts?.[0] ? 
                  (apiEx.bodyParts[0].charAt(0).toUpperCase() + apiEx.bodyParts[0].slice(1)) : 
                  'Otros';
              }

              return {
                api_id: apiEx.exerciseId,
                name: apiEx.name,
                category: mappedCategory,
                equipment: apiEx.equipments?.[0] || 'Cualquiera',
                image_url: apiEx.imageUrl,
              };
            });
            
            allStubs = [...allStubs, ...pageStubs];
          }
        }
        
        offset += 30;
        if (allStubs.length >= targetCount || offset > 100) hasMore = false;
      }
      
      if (allStubs.length > 0) {
        const uniqueStubs = Array.from(new Map(allStubs.filter(s => s.api_id).map(s => [s.api_id, s])).values());
        
        const { data: insertedData, error: upsertError } = await supabase
          .from('exercises')
          .upsert(uniqueStubs, { onConflict: 'api_id' })
          .select();
        
        if (upsertError) {
          console.error('Upsert Error:', upsertError);
        }

        if (insertedData) {
          if (category === 'Todos') {
            setExercises(insertedData.slice(0, 200));
          } else {
             setExercises(insertedData.filter(e => e.category === category).slice(0, 200));
          }
        }
      }
    } catch(e) {
      console.error('Failed API fetch', e);
    }
    
    setLoading(false);
  };

  const handleExerciseClick = async (ex: Exercise) => {
    if (fetchingDetailsId) return;
    
    // Si ya tiene el video_url cacheado en la base de datos, lo abrimos inmediatamente (Cero demoras)
    if (ex.video_url || !ex.api_id) {
       setSelectedExercise(ex);
       return;
    }

    setFetchingDetailsId(ex.id);
    
    // Fetch full detail to get video and instructions lazily
    const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
    let fullDetails = { ...ex };
    try {
      const resp = await fetch(`https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/${ex.api_id}`, {
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com' }
      });
      const data = await resp.json();
      if (data.data) {
        const d = data.data;
        fullDetails = {
           ...ex,
           video_url: d.videoUrl || null,
           instructions: d.instructions || null,
           tips: d.exerciseTips || null,
        };

        // Cache this specific full detail into Supabase for next time (Lazy update)
        await supabase.from('exercises').update({
           video_url: fullDetails.video_url,
           instructions: fullDetails.instructions,
           tips: fullDetails.tips
        }).eq('id', ex.id);
        
        // Update local state list to avoid querying again if closed and reopened
        setExercises(prev => prev.map(p => p.id === ex.id ? fullDetails : p));
      }
    } catch(e) {
       console.error(e);
    } finally {
      setFetchingDetailsId(null);
      setSelectedExercise(fullDetails);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-[#030303] flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="pt-12 pb-4 px-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black italic uppercase tracking-tighter">Marketplace</h1>
              {!loading && exercises.length > 0 && (
                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                  {exercises.length}
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">
              {mode === 'add' ? 'Añadir a tu rutina' : 'Reemplazar ejercicio'}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Filters (Horizontal Scroll) */}
        <div className="px-4 py-4 z-10 space-y-3 border-b border-white/5">
          {/* Categories */}
          <div className="flex space-x-2 overflow-x-auto custom-scrollbar pb-1 -mx-4 px-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all flex items-center gap-1.5 ${activeCategory === cat ? 'bg-primary text-black shadow-[0_0_15px_rgba(0,242,255,0.2)]' : 'bg-white/5 text-white/40 border border-white/5 hover:text-white'}`}
              >
                {cat}
                {activeCategory === cat && !loading && (
                   <span className="opacity-60 text-[8px]">({exercises.length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 pb-32 relative">
          {/* Background Element */}
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,242,255,0.03)_0%,transparent_70%)] opacity-50" />

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Cargando base de datos...</p>
             </div>
          ) : exercises.length > 0 ? (
            exercises.map(ex => (
              <div 
                key={ex.id} 
                onClick={() => handleExerciseClick(ex)}
                className={`group relative flex items-center gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-2xl transition-all overflow-hidden ${fetchingDetailsId === ex.id ? 'opacity-50 cursor-wait' : 'hover:bg-white/[0.05] hover:border-white/10 cursor-pointer'}`}
              >
                {/* Media Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/50 border border-white/5 relative flex items-center justify-center">
                  {fetchingDetailsId === ex.id ? (
                     <Loader2 className="animate-spin text-primary w-5 h-5" />
                  ) : ex.image_url ? (
                    ex.image_url.includes('.mp4') ? (
                      <video src={ex.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10">
                      <LayoutGrid size={20} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{ex.name}</h3>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="text-[9px] uppercase text-primary tracking-widest font-bold">{ex.category}</span>
                    {ex.equipment && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[9px] uppercase text-white/30 tracking-widest">{ex.equipment}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Icon */}
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/30 group-hover:bg-primary/20 group-hover:text-primary group-hover:border-primary/30 transition-all shrink-0">
                  <ChevronRight size={16} />
                </div>
              </div>
            ))
          ) : (
              <div className="py-20 text-center space-y-4">
                <p className="text-white/30 font-medium text-sm">No hay ejercicios para esta categoría.</p>
             </div>
          )}
        </div>
      </div>

      <ExerciseDetailSheet
        exercise={selectedExercise}
        isOpen={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        mode={mode}
        onAction={(ex) => {
           onSelect(ex); // Since everything flows through DB, UUID is guaranteed
           onClose(); 
        }}
      />
    </>
  );
};

export default ExerciseMarketplace;
