import React, { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { motion } from 'framer-motion';
import { LogOut, User as UserIcon, Shield, Settings, Bell, CircleCheck } from 'lucide-react';
import { Profile } from '../types';

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="space-y-8 max-w-lg mx-auto pb-8">
      <header>
        <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Athlete Account</h2>
        <h1 className="text-3xl font-black tracking-tight italic uppercase">Profile</h1>
      </header>

      {/* User Info Card */}
      <div className="glass-card p-6 flex items-center space-x-6">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-3xl font-black italic">
          {profile?.full_name?.charAt(0) || <UserIcon size={32} />}
        </div>
        <div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">{profile?.full_name || 'Athlete'}</h2>
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest flex items-center">
            <Shield size={12} className="mr-1 text-primary" /> Pro Member
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-2">Preferences</h3>
        
        <div className="glass-card overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center space-x-3">
              <Settings size={18} className="text-white/30" />
              <span className="font-bold text-sm tracking-tight italic uppercase">App Settings</span>
            </div>
            <div className="w-8 h-4 bg-primary/10 rounded-full relative">
              <div className="absolute left-1 top-1 w-2 h-2 bg-primary rounded-full" />
            </div>
          </div>
          
          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center space-x-3">
              <Bell size={18} className="text-white/30" />
              <span className="font-bold text-sm tracking-tight italic uppercase">Notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-primary font-black uppercase italic">Active</span>
              <CircleCheck size={14} className="text-primary" />
            </div>
          </div>

          <button 
            onClick={handleSignOut}
            className="w-full p-4 flex items-center space-x-3 text-red-500 hover:bg-red-500/5 transition-colors"
          >
            <LogOut size={18} />
            <span className="font-bold text-sm tracking-tight italic uppercase">Secure Logout</span>
          </button>
        </div>
      </div>

      <div className="p-8 text-center">
        <p className="text-[10px] text-white/10 uppercase tracking-[0.3em] font-black italic">FitPlanner Pro v1.0.0</p>
      </div>
    </div>
  );
};

export default ProfilePage;
