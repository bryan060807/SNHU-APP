/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  GraduationCap, Mail, Lock, User, ArrowRight, 
  Loader2, Database, Globe, Zap, Brain, Activity,
  ChevronRight, ShieldCheck
} from 'lucide-react';
import { useToast } from '../Toast'; 
import { cn } from '../../lib/utils'; 

export function AuthView() {
  const [showTerminal, setShowTerminal] = useState(false);
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
      
      {/* GLOBAL HEADER */}
      <nav className="w-full p-8 border-b-2 border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <GraduationCap size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">SNHU Compass</h1>
        </div>
        <div className="flex gap-4 md:gap-8 items-center">
           <a href="/privacy" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Privacy</a>
           <button 
            onClick={() => setShowTerminal(true)}
            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
           >
             Initialize Link
           </button>
        </div>
      </nav>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        
        {/* LEFT SIDE: PUBLIC UTILITY DISCLOSURE */}
        <div className="p-12 lg:p-24 flex flex-col justify-center space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <ShieldCheck size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Verified Academic Tool</span>
            </div>
            <h2 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-[0.85]">
              SNHU <br /> <span className="text-blue-600">Academics.</span>
            </h2>
            <div className="max-w-md space-y-4">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase leading-relaxed italic tracking-tight">
                SNHU Compass is a centralized terminal built for the modern student. 
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-500 leading-relaxed border-l-4 border-blue-600 pl-4">
                This application aggregates your Google Calendar and Tasks data into a unified dashboard to manage course milestones. It also utilizes Google Drive metadata to provide quick-access links to your academic archives.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <FeatureItem icon={<Activity className="text-blue-600" />} title="Neural Sync" desc="Unified deadline management via Google Calendar." />
            <FeatureItem icon={<Brain className="text-purple-600" />} title="Biometrics" desc="Stress and recovery tracking for academic longevity." />
            <FeatureItem icon={<Zap className="text-amber-500" />} title="Focus Engine" desc="High-voltage study cycles tuned for deep work." />
            <FeatureItem icon={<Database className="text-emerald-500" />} title="Archives" desc="Direct metadata access to SNHU Drive documents." />
          </div>
        </div>

        {/* RIGHT SIDE: INTERACTIVE CALL-TO-ACTION */}
        <div className="flex items-center justify-center p-6 lg:p-12 bg-slate-100/50 dark:bg-slate-900/20">
          {!showTerminal ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto shadow-2xl">
                <Database size={48} className="text-blue-600" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Ready to Extract?</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Initialize the SNHU Compass Mainframe</p>
              </div>
              <button 
                onClick={() => setShowTerminal(true)}
                className="group flex items-center gap-4 bg-blue-600 text-white px-10 py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 mx-auto"
              >
                <span>Access Terminal</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 p-10 md:p-12 relative"
            >
              <button 
                onClick={() => setShowTerminal(false)}
                className="absolute top-8 right-8 text-slate-300 hover:text-blue-600 transition-colors"
              >
                <ArrowRight className="rotate-180" size={20} />
              </button>

              <div className="flex flex-col items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Identity Check</h3>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 text-center">Establish Link via SNHU Logic Gate</p>
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
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><span className="italic">{isLogin ? 'Sync' : 'Create'}</span> <ArrowRight size={20} /></>}
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
            </motion.div>
          )}
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