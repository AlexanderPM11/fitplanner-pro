import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { Search, Plus, X, Loader2, Save, ChevronDown } from 'lucide-react';
import type { Exercise } from '../../types';
import { useNotification } from '../../context/NotificationContext';

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

      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: newName.trim(),
          category: newCategory.trim(),
          user_id: user.id
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
          <div className="glass-card p-6 space-y-4">
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
              <div>
                <h3 className="font-bold group-hover:text-primary transition-colors">{ex.name}</h3>
                <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{ex.category}</span>
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
