import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { Search, Plus, X, Loader2, Save, ChevronDown, Image as ImageIcon } from 'lucide-react';
import type { Exercise } from '../../types';
import { useNotification } from '../../context/NotificationContext';

interface ExerciseDBItem {
  exerciseId: string;
  name: string;
  imageUrl: string;
  videoUrl?: string;
  target?: string;
}

const CATEGORIES = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio', 'Cuerpo Completo', 'Otro'];

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

const ExercisePicker: React.FC<ExercisePickerProps> = ({ onSelect, onClose }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [creating, setCreating] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [enrichedDetail, setEnrichedDetail] = useState<any>(null);
  
  // External API States
  const [externalQuery, setExternalQuery] = useState('');
  const [externalResults, setExternalResults] = useState<ExerciseDBItem[]>([]);
  const [isExternalSearching, setIsExternalSearching] = useState(false);

  const { showToast } = useNotification();

  useEffect(() => {
    async function fetchExercises() {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      if (data) setExercises(data);
      setLoading(false);
    }
    fetchExercises();
  }, []);

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    ex.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateExercise = async () => {
    if (!newName.trim() || !newCategory.trim()) {
      showToast('Por favor, ingresa el nombre y la categoría.', 'error');
      return;
    }
    
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let imageUrl = null;

      if (newImageFile) {
        const fileExt = newImageFile.name.split('.').pop();
        const filePath = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('exercises')
          .upload(filePath, newImageFile);
          
        if (uploadError) {
          showToast('Error al subir el archivo multimedia', 'error');
          setCreating(false);
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('exercises')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      } else if (previewUrl && previewUrl.startsWith('http')) {
        // If they selected an external API GIF and didn't upload a new file
        imageUrl = previewUrl;
      }

      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: newName.trim(),
          category: newCategory.trim(),
          user_id: user.id,
          image_url: imageUrl,
          video_url: videoUrl,
          instructions: enrichedDetail?.instructions || null,
          tips: enrichedDetail?.exerciseTips || null,
          difficulty: enrichedDetail?.difficultyLevel || null,
          male_activation_url: enrichedDetail?.maleMuscleActivationUrl || null,
          female_activation_url: enrichedDetail?.femaleMuscleActivationUrl || null
        })
        .select()
        .single();
      
      if (error) throw error;

      showToast('Ejercicio creado y seleccionado', 'success');
      onSelect(data);
    } catch (error) {
      console.error(error);
      showToast('Error al crear el ejercicio', 'error');
    } finally {
      setCreating(false);
      setNewImageFile(null);
      setPreviewUrl(null);
      setVideoUrl(null);
      setEnrichedDetail(null);
      setExternalResults([]);
    }
  };

  const handleExternalSearch = async () => {
    if (!externalQuery.trim()) return;
    setIsExternalSearching(true);
    
    const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
    if (!apiKey) {
      showToast('Falta configurar VITE_RAPIDAPI_KEY', 'error');
      setIsExternalSearching(false);
      return;
    }

    try {
      const response = await fetch(`https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/search?search=${encodeURIComponent(externalQuery)}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'
        }
      });
      const res = await response.json();
      if (res.success && Array.isArray(res.data)) {
        setExternalResults(res.data);
      } else {
        setExternalResults([]);
        showToast('No se encontraron resultados', 'info');
      }
    } catch (error) {
      console.error(error);
      showToast('Error conectando al API global', 'error');
    } finally {
      setIsExternalSearching(false);
    }
  };

  const mapTargetToCategory = (target: string) => {
    const map: Record<string, string> = {
      'pectorals': 'Pecho', 'lats': 'Espalda', 'upper back': 'Espalda', 'spine': 'Espalda',
      'delts': 'Hombros', 'biceps': 'Brazos', 'triceps': 'Brazos', 'forearms': 'Brazos',
      'abs': 'Core', 'quads': 'Piernas', 'hamstrings': 'Piernas', 'glutes': 'Piernas',
      'calves': 'Piernas', 'cardiovascular system': 'Cardio'
    };
    return map[target] || 'Otro';
  };

  const selectExternalExercise = async (ex: ExerciseDBItem) => {
    const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
    if (!apiKey) return;

    setCreating(true); // Reuse creating state as loading indicator
    showToast('Obteniendo detalles completos...', 'info');

    try {
      const response = await fetch(`https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/${ex.exerciseId}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'
        }
      });
      const res = await response.json();
      const finalData = res.success ? res.data : ex;

      // Uppercase first letter
      const formattedName = finalData.name.charAt(0).toUpperCase() + finalData.name.slice(1);
      setNewName(formattedName);
      setNewCategory(finalData.target ? mapTargetToCategory(finalData.target) : 'Otro');
      setPreviewUrl(finalData.imageUrl);
      setVideoUrl(finalData.videoUrl || null);
      setEnrichedDetail(finalData);
      setNewImageFile(null); // Clear any local upload
      showToast('Media y datos pre-cargados con éxito', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error al cargar detalles extra', 'error');
    } finally {
      setCreating(false);
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl p-4 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black italic uppercase tracking-tight">{isCreating ? 'Crear Ejercicio' : 'Añadir Ejercicio'}</h2>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full">
          <X size={20} />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input
          type="text"
          placeholder="Buscar ejercicios (ej. Pecho, Sentadilla)..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus={!isCreating}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-24">
        {loading ? (
          <div className="py-20 text-center text-white/20 font-bold animate-pulse uppercase italic">Cargando biblioteca...</div>
        ) : isCreating ? (
          <div className="glass-card p-6 space-y-6">
            
            {/* Buscador Global API */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <label className="block text-[10px] uppercase font-bold text-primary mb-2">Auto-completar desde Internet</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={externalQuery}
                  onChange={(e) => setExternalQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExternalSearch()}
                  placeholder="Ej. Bicep Curl, Squat..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none text-sm transition-all text-white placeholder-white/30"
                />
                <button
                  onClick={handleExternalSearch}
                  disabled={isExternalSearching}
                  className="px-4 bg-primary text-black rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isExternalSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </button>
              </div>

              {externalResults.length > 0 && (
                <div className="mt-4 flex space-x-3 overflow-x-auto pb-2 custom-scrollbar">
                  {externalResults.map((ex) => (
                    <button
                      key={ex.exerciseId}
                      onClick={() => selectExternalExercise(ex)}
                      className="shrink-0 w-32 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all text-left group bg-white/5"
                    >
                      <div className="h-24 w-full bg-white/10">
                        <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] font-bold text-white uppercase truncate">{ex.name}</p>
                        {ex.target && <p className="text-[9px] text-white/50 uppercase">{ex.target}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-[1px] w-full bg-white/10 my-4"></div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Nombre del Ejercicio</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Remo en máquina"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none transition-all"
                autoFocus
              />
            </div>
            <div className="relative">
              <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Categoría</label>
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 flex justify-between items-center outline-none transition-all hover:bg-white/10"
              >
                <span className="text-white">{newCategory}</span>
                <ChevronDown size={16} className={`text-white/50 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10 max-h-48 overflow-y-auto custom-scrollbar">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setNewCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-primary/20 hover:text-primary transition-colors text-sm"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Avatar / Video (Opcional)</label>
              <div className="relative border-2 border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors p-4 text-center cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*,video/mp4" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {previewUrl ? (
                  newImageFile?.type.startsWith('video/') ? (
                    <video src={previewUrl} className="w-full h-24 object-cover rounded-lg" autoPlay loop muted playsInline />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-24 object-cover rounded-lg" />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 py-4 pointer-events-none">
                    <ImageIcon size={24} className="text-white/20" />
                    <span className="text-xs font-bold text-white/30 uppercase">Subir Media</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button 
                onClick={() => setIsCreating(false)}
                className="flex-1 py-3 bg-white/5 rounded-xl font-bold uppercase text-xs"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateExercise}
                disabled={creating}
                className="flex-1 py-3 bg-primary text-black rounded-xl font-black italic uppercase tracking-tighter shadow-lg flex justify-center items-center space-x-2 disabled:opacity-50"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Guardar</span>
              </button>
            </div>
          </div>
        ) : filteredExercises.length > 0 ? (
          filteredExercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full glass-card p-4 flex items-center justify-between text-left hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center space-x-3">
                {ex.image_url ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5 border border-white/10">
                    {ex.image_url.includes('.mp4') ? (
                      <video src={ex.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-70" />
                    ) : (
                      <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg shrink-0 bg-white/5 border border-white/10 flex items-center justify-center">
                    <ImageIcon size={16} className="text-white/20" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold group-hover:text-primary transition-colors">{ex.name}</h3>
                  <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{ex.category}</span>
                </div>
              </div>
              <Plus size={18} className="text-primary" />
            </button>
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <p className="text-white/20 font-medium">No se encontraron resultados.</p>
            <button 
              onClick={() => {
                setNewName(search);
                setIsCreating(true);
              }}
              className="px-6 py-3 bg-primary/10 text-primary rounded-xl font-bold uppercase text-xs hover:bg-primary/20 transition-all"
            >
              Crear Nuevo Ejercicio
            </button>
          </div>
        )}
      </div>

      {!isCreating && (
        <div className="absolute bottom-6 left-4 right-4">
          <button 
            onClick={() => setIsCreating(true)}
            className="w-full py-4 bg-white border border-white/10 rounded-2xl text-black font-black uppercase tracking-tighter italic shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span>Crear Ejercicio Personalizado</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExercisePicker;
