/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  GraduationCap, Mail, Lock, User, ArrowRight, 
  Loader2, Database, Globe, Zap, Brain, Activity 
} from 'lucide-react';
import { useToast } from '../Toast'; 
import { cn } from '../../lib/utils'; 

export function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      showToast('Initialize Link', 'Establishing Google Neural Link...', 'info');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
          queryParams: { access_type: 'offline', prompt: 'consent' },
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      showToast('Neural Link Error', error.message || 'Google Auth failed', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        showToast('Identity Created', 'Verify your email to initialize sync.', 'success');
      }
    } catch (error: any) {
      showToast('Access Denied', error.message || 'Authentication Failure', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300 font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. PUBLIC HEADER / APP PURPOSE (Google Requirement) */}
      <nav className="w-full p-8 border-b-2 border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <GraduationCap size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">SNHU Compass</h1>
        </div>
        <div className="hidden md:flex gap-8">
           <a href="#purpose" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Mission Briefing</a>
           <a href="/privacy" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Privacy</a>
        </div>
      </nav>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT SIDE: MARKETING/PURPOSE (Google Requirement) */}
        <div id="purpose" className="p-12 lg:p-24 flex flex-col justify-center space-y-12 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">
              Operationalize <br /> <span className="text-blue-600">Your Academics.</span>
            </h2>
            <p className="max-w-md text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight italic">
              SNHU Compass is a specialized dashboard designed for Southern New Hampshire University students to centralize course milestones, biometric recovery, and neural focus cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <FeatureItem icon={<Activity className="text-blue-600" />} title="Neural Sync" desc="Aggregates Google Calendar & Tasks into a single high-intensity view." />
            <FeatureItem icon={<Brain className="text-purple-600" />} title="Biometric Tracking" desc="Monitor neuro-stress and recovery cycles to prevent academic burnout." />
            <FeatureItem icon={<Zap className="text-amber-500" />} title="Focus Engine" desc="High-voltage Pomodoro cycles tuned for complex course extraction." />
            <FeatureItem icon={<Database className="text-emerald-500" />} title="Secure Archives" desc="Encrypted metadata links to your SNHU Drive documents." />
          </div>
        </div>

        {/* RIGHT SIDE: THE AUTH TERMINAL */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 p-10 md:p-12">
            <div className="flex flex-col items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Initialize Sync</h3>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Access the SNHU Compass Mainframe</p>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200 hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95 shadow-sm mb-8"
            >
              <Database size={16} className="text-blue-600" />
              Continue with Google
            </button>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Identity Label</label>
                  <input
                    type="text" required value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-2xl focus:border-blue-600 outline-none font-bold dark:text-white uppercase italic text-sm"
                    placeholder="BRYAN MILLER"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Logic Channel</label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-2xl focus:border-blue-600 outline-none font-bold dark:text-white uppercase text-xs"
                  placeholder="NAME@SNHU.EDU"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Access Key</label>
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-2xl focus:border-blue-600 outline-none font-bold dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit" disabled={isLoading}
                className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl active:scale-[0.98] group"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><span className="italic">{isLogin ? 'Initialize' : 'Register'}</span> <ArrowRight size={20} /></>}
              </button>
            </form>

            <div className="mt-8 text-center flex flex-col gap-6">
              <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest italic underline decoration-2 underline-offset-4">
                {isLogin ? "New identity? Register" : "Existing identity? Log In"}
              </button>
              <div className="flex justify-center gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <a href="/privacy" className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest italic">Privacy</a>
                <a href="/tos" className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest italic">Terms</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {icon}
        <h4 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{title}</h4>
      </div>
      <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-tighter">{desc}</p>
    </div>
  );
}