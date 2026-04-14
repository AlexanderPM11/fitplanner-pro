import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { Search, Plus, X } from 'lucide-react';
import type { Exercise } from '../../types';

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

const ExercisePicker: React.FC<ExercisePickerProps> = ({ onSelect, onClose }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl p-4 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black italic uppercase tracking-tight">Select Exercise</h2>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full">
          <X size={20} />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input
          type="text"
          placeholder="Search exercises (e.g. Chest, Squat)..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="py-20 text-center text-white/20 font-bold animate-pulse uppercase italic">Loading Library...</div>
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
          <div className="py-20 text-center text-white/20">No exercises found</div>
        )}
      </div>
    </div>
  );
};

export default ExercisePicker;
