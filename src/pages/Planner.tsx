import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { Schedule, Workout, ScheduleCompletion } from '../types';
import WeeklyCalendar from '../components/planner/WeeklyCalendar';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const Planner = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [completions, setCompletions] = useState<ScheduleCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState<number | null>(null); // day index
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useNotification();

  useEffect(() => {
    fetchSchedules();
    fetchAvailableWorkouts();
    fetchCompletions();
  }, []);

  const getStartOfWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0,0,0,0);
    return start.toISOString().split('T')[0];
  };

  const fetchCompletions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startOfWeek = getStartOfWeek();
    
    // We fetch completions from the start of the current week onwards
    const { data, error } = await supabase
      .from('schedule_completions')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_at', startOfWeek);

    if (error) console.error('Error fetching completions:', error);
    else setCompletions(data || []);
  };

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*, workout:workouts(*)')
      .order('day_of_week', { ascending: true });
    
    if (error) console.error('Error fetching schedules:', error);
    else setSchedules(data || []);
    setLoading(false);
  };

  const fetchAvailableWorkouts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_template', true)
      .order('name', { ascending: true });
    
    if (error) console.error('Error fetching workouts:', error);
    else setTemplates(data || []);
  };

  const handleAddWorkoutToDay = async (workoutId: string) => {
    if (showAddModal === null) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('schedules')
      .insert({
        user_id: user.id,
        workout_id: workoutId,
        day_of_week: showAddModal
      });

    if (error) {
      console.error('Error adding schedule:', error);
      showToast('This workout is already scheduled for this day.', 'error');
    } else {
      setShowAddModal(null);
      fetchSchedules();
    }
  };

  const handleRemoveSchedule = async (scheduleId: string) => {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);
    
    if (error) console.error('Error removing schedule:', error);
    else fetchSchedules();
  };

  const handleStartWorkout = (workoutId: string) => {
    // Navigate to editor with the template ID to clone it
    navigate(`/workout?templateId=${workoutId}`);
  };

  const handleToggleCompletion = async (scheduleId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const existing = completions.find(c => c.schedule_id === scheduleId && c.completed_at === today);

    if (existing) {
      const { error } = await supabase
        .from('schedule_completions')
        .delete()
        .eq('id', existing.id);
      
      if (!error) {
        setCompletions(completions.filter(c => c.id !== existing.id));
      }
    } else {
      const { data, error } = await supabase
        .from('schedule_completions')
        .insert({
          user_id: user.id,
          schedule_id: scheduleId,
          completed_at: today
        })
        .select()
        .single();
      
      if (!error && data) {
        setCompletions([...completions, data]);
      }
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      <Helmet>
        <title>Weekly Planner | FitPlanner Pro</title>
      </Helmet>

      <header>
        <div className="flex items-center space-x-3 mb-1">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Calendar size={20} />
          </div>
          <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Training Organization</h2>
        </div>
        <h1 className="text-3xl font-black tracking-tight italic uppercase">Weekly Planner</h1>
        <p className="text-white/30 text-xs font-medium mt-1">Organize your training split from Monday to Sunday.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <WeeklyCalendar 
          schedules={schedules}
          completions={completions}
          onAddWorkout={(day) => setShowAddModal(day)}
          onRemoveSchedule={handleRemoveSchedule}
          onStartWorkout={handleStartWorkout}
          onToggleCompletion={handleToggleCompletion}
        />
      )}

      {/* Add Workout Modal */}
      <AnimatePresence>
        {showAddModal !== null && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-black italic uppercase tracking-tighter text-xl">Assign Routine</h3>
                <button onClick={() => setShowAddModal(null)} className="p-2 hover:bg-white/5 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    type="text"
                    placeholder="Search your routines..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-primary/50 transition-colors text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((t) => (
                      <button 
                        key={t.id}
                        onClick={() => handleAddWorkoutToDay(t.id)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/30 rounded-2xl transition-all group text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold uppercase italic text-sm group-hover:text-primary transition-colors truncate">{t.name}</h4>
                          <div className="flex items-center space-x-2 mt-0.5">
                            {t.is_template ? (
                              <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Routine</span>
                            ) : (
                              <span className="text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Past Session</span>
                            )}
                            <span className="text-[9px] text-white/20 uppercase font-black">
                              {new Date(t.started_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Calendar size={16} className="text-white/10 group-hover:text-primary/50 ml-3 shrink-0" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-10 space-y-3">
                      <p className="text-white/20 text-sm italic">You don't have any routines saved as templates yet.</p>
                      <button 
                        onClick={() => navigate('/workout')}
                        className="text-primary font-bold uppercase text-xs tracking-widest hover:underline"
                      >
                        Create a Routine
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Planner;
