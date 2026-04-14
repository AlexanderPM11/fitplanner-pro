import React, { useState } from 'react';
import { supabase } from '../../api/supabase';
import { Dumbbell, Mail, Lock, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Dumbbell size={80} />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2 uppercase tracking-tighter italic">
            FitPlanner <span className="text-primary">Pro</span>
          </h1>
          <p className="text-white/50 text-sm">
            {isSignUp ? 'Create your profile to start tracking' : 'Welcome back, athlete'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-xs bg-red-400/10 p-3 rounded-xl border border-red-400/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white/50 hover:text-primary transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
