import React, { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, Activity, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    getProfile();
  }, []);

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Athlete Dashboard</h2>
          <h1 className="text-3xl font-black tracking-tight italic">
            {profile?.full_name?.split(' ')[0] || 'CRUSH IT!'}
          </h1>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            profile?.full_name?.charAt(0) || '?'
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-5 border-l-4 border-l-primary"
        >
          <div className="flex items-center text-white/30 mb-2">
            <Activity size={14} className="mr-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Volume This Week</span>
          </div>
          <p className="text-2xl font-black italic">-- <span className="text-xs font-normal text-white/30 not-italic">kg</span></p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card p-5 border-l-4 border-l-secondary"
        >
          <div className="flex items-center text-white/30 mb-2">
            <Trophy size={14} className="mr-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">PRs Set</span>
          </div>
          <p className="text-2xl font-black italic">--</p>
        </motion.div>
      </div>

      {/* Active Session Call to Action */}
      <div className="relative group overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-primary to-secondary text-black shadow-[0_20px_50px_rgba(0,242,255,0.3)]">
        <div className="relative z-10">
          <h3 className="text-2xl font-black italic mb-1 uppercase tracking-tighter">Ready to lift?</h3>
          <p className="text-black/60 text-sm font-medium mb-6">Your next workout is waiting for you.</p>
          <Link 
            to="/workout"
            className="inline-flex items-center bg-black text-white px-6 py-3 rounded-2xl font-bold transition-transform active:scale-95"
          >
            <Plus size={20} className="mr-2" />
            Start Session
          </Link>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
        <Dumbbell className="absolute -bottom-4 -right-4 w-32 h-32 text-black/10 -rotate-12" size={120} />
      </div>

      {/* Recent Activity List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-lg uppercase tracking-tight italic">Recent Activity</h4>
          <Link to="/history" className="text-primary text-xs font-bold uppercase hover:underline">View All</Link>
        </div>
        
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-4 flex items-center justify-between opacity-50 grayscale">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mr-4">
                  <Activity size={18} />
                </div>
                <div>
                  <h5 className="font-bold text-sm">Example Workout</h5>
                  <p className="text-[10px] text-white/30">Complete this to see your history</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
