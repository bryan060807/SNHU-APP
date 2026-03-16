/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GraduationCap, Mail, Lock, User, ArrowRight, Loader2, Database, Globe } from 'lucide-react';
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
      const redirectURL = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // INDUSTRIAL SCOPES: Targets restricted data for academic sync
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent', // Forces scope validation for Google audit compliance
          },
          redirectTo: redirectURL,
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
        showToast('Systems Online', 'Successfully synced to SNHU Compass.', 'success');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-300 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-10 md:p-12">
          
          {/* Header Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-600/20">
              <GraduationCap size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase text-center leading-none">SNHU Compass</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-3 text-center">
              Initialize Academic Sync // AIBRY Mainframe
            </p>
          </div>

          {/* OAuth Section */}
          <div className="space-y-4 mb-8">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm active:scale-95"
            >
              <Database size={16} className="text-blue-600" />
              Continue with Google
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">OR</span>
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Identity Label</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-2xl focus:border-blue-600 outline-none transition-all font-bold dark:text-white italic uppercase text-sm"
                    placeholder="BRYAN MILLER"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Logic Channel (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-2xl focus:border-blue-600 outline-none transition-all font-bold dark:text-white uppercase text-xs tracking-tighter"
                  placeholder="NAME@SNHU.EDU"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Access Key (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-2xl focus:border-blue-600 outline-none transition-all font-bold dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98] disabled:opacity-70 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="italic">{isLogin ? 'Initialize Sync' : 'Create Identity'}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Section */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest italic underline decoration-2 underline-offset-4 decoration-slate-100 dark:decoration-slate-800"
            >
              {isLogin ? "New identity? Register" : "Existing identity? Log In"}
            </button>
          </div>

          {/* HARDENED LEGAL FOOTER FOR GOOGLE COMPLIANCE */}
          <div className="mt-10 pt-8 border-t-2 border-slate-50 dark:border-slate-800">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Globe size={12} className="text-slate-300 animate-pulse" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Public Protocol</p>
            </div>
            <div className="flex justify-center gap-8">
              <a href="/privacy" className="text-[10px] font-black text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest italic border-b border-transparent hover:border-blue-600">
                Privacy
              </a>
              <a href="/tos" className="text-[10px] font-black text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest italic border-b border-transparent hover:border-blue-600">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}