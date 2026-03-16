/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  User, Moon, Sun, Brain, Database, Save, LogOut, 
  Loader2, Calendar, Layout, HardDrive 
} from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

export function Settings() {
  const { user, signOut, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Local State
  const [name, setName] = useState(user?.full_name || '');
  const [theme, setTheme] = useState<'light' | 'dark'>(user?.theme || 'dark');
  const [aiPersonalization, setAiPersonalization] = useState(user?.ai_personalization || '');
  const [aiMemory, setAiMemory] = useState(user?.ai_memory || '');
  const [wellnessEnabled, setWellnessEnabled] = useState(user?.wellness_enabled !== false);
  const [birthday, setBirthday] = useState(user?.birthday || '');
  
  // Google Integration States
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [syncCalendar, setSyncCalendar] = useState(true);
  const [syncTasks, setSyncTasks] = useState(true);
  const [syncDrive, setSyncDrive] = useState(false);

  const personalizationPresets = {
    'Supportive Mentor': 'Be a supportive, encouraging mentor. Use academic language but keep it warm and motivating.',
    'Strict Taskmaster': 'Be a strict, focused taskmaster. Keep interactions brief, prioritize deadlines, and push me to be productive.',
    'AIBRY Mode': 'Technical, physical, and industrial language. Focus on rebar, concrete, and voltage. Aggressive yet resilient tone.'
  };

  const applyPreset = (preset: keyof typeof personalizationPresets) => {
    setAiPersonalization(personalizationPresets[preset]);
    showToast('Matrix Updated', `${preset} parameters loaded.`, 'info');
  };

  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
      setTheme(user.theme || 'dark');
      setAiPersonalization(user.ai_personalization || '');
      setAiMemory(user.ai_memory || '');
      setBirthday(user.birthday || '');
      setWellnessEnabled(user.wellness_enabled !== false);
    }
  }, [user]);

  useEffect(() => {
    const checkGoogleStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const providers = session?.user?.app_metadata?.providers || [];
      setIsGoogleConnected(providers.includes('google'));
    };
    checkGoogleStatus();
  }, [user]);

  const handleConnectGoogle = async () => {
    try {
      showToast('Redirecting', 'Initializing Google Neural Link...', 'info');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // SCOPES: Optimized for SNHU Compass Ecosystem
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
          queryParams: { 
            access_type: 'offline', 
            prompt: 'consent' // CRITICAL: Forces full permission checklist
          },
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      showToast('Link Error', error.message || 'Failed to initiate Google connection', 'error');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (!sbUser) throw new Error("No active session");

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: sbUser.id,
          full_name: name,
          theme,
          ai_personalization: aiPersonalization,
          ai_memory: aiMemory,
          wellness_enabled: wellnessEnabled,
          birthday: birthday || null,
        });

      if (error) throw error;

      // DOM Theme Application
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');

      updateUser({ 
        full_name: name, 
        theme, 
        ai_personalization: aiPersonalization, 
        ai_memory: aiMemory,
        wellness_enabled: wellnessEnabled,
        birthday,
      });

      showToast('Success', 'System configuration synced and encrypted.', 'success');
      
    } catch (error: any) {
      showToast('Error', error.message || 'Failed to update settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Control Center</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">System Personalization & Neural Links</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-6 py-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all border-2 border-slate-100 dark:border-slate-800 hover:border-rose-500 active:scale-95"
        >
          <LogOut size={18} />
          <span>Terminate Session</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                <User size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Biometric ID</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Label</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-black outline-none focus:border-blue-600 transition-all italic"
                  placeholder="BRYAN MILLER"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origin Date (Birthday)</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-black outline-none focus:border-blue-600 transition-all"
                />
              </div>
            </div>
          </section>

          {/* AI Buddy Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-600/20">
                <Brain size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Neural Buddy Config</h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personality Matrix</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(personalizationPresets).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => applyPreset(preset as keyof typeof personalizationPresets)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-2 border-transparent hover:border-blue-600 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-blue-600 transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  value={aiPersonalization}
                  onChange={(e) => setAiPersonalization(e.target.value)}
                  rows={3}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-medium outline-none focus:border-blue-600 transition-all text-sm leading-relaxed"
                  placeholder="Define the AI's core behavior..."
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Long-Term Memory Archives</label>
                <textarea
                  value={aiMemory}
                  onChange={(e) => setAiMemory(e.target.value)}
                  rows={3}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-medium outline-none focus:border-blue-600 transition-all text-sm leading-relaxed"
                  placeholder="Key facts the AI should always remember about your workflow..."
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Google Integration Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Logic Relay</h3>
              <div className={cn(
                "w-3 h-3 rounded-full shadow-lg transition-all duration-500", 
                isGoogleConnected ? "bg-emerald-500 shadow-emerald-500/50 animate-pulse" : "bg-slate-300 dark:bg-slate-700"
              )} />
            </div>

            {isGoogleConnected ? (
              <div className="space-y-4">
                <IntegrationToggle icon={<Calendar size={18}/>} label="Schedule Sync" active={syncCalendar} onChange={setSyncCalendar} />
                <IntegrationToggle icon={<Layout size={18}/>} label="Objective Sync" active={syncTasks} onChange={setSyncTasks} />
                <IntegrationToggle icon={<HardDrive size={18}/>} label="Archives Access" active={syncDrive} onChange={setSyncDrive} />
                <button 
                  onClick={handleConnectGoogle}
                  className="w-full py-4 text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition-all tracking-[0.2em]"
                >
                  Override Permissions
                </button>
              </div>
            ) : (
              <button 
                onClick={handleConnectGoogle}
                className="w-full py-5 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:border-blue-600 transition-all shadow-sm active:scale-95"
              >
                <Database size={18} className="text-blue-600" />
                Initialize Google Link
              </button>
            )}
          </section>

          {/* Visuals Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl space-y-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Visual Spectrum</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-[2rem] border-2 border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                  theme === 'light' ? "bg-white text-blue-600 shadow-xl" : "text-slate-500"
                )}
              >
                <Sun size={16} /> Day
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                  theme === 'dark' ? "bg-slate-700 text-white shadow-xl" : "text-slate-500"
                )}
              >
                <Moon size={16} /> Night
              </button>
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/40 disabled:opacity-50 active:scale-[0.98] group"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Save size={24} className="group-hover:scale-110 transition-transform" /> 
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationToggle({ icon, label, active, onChange }: { icon: any, label: string, active: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800">
      <div className="flex items-center gap-4">
        <div className={cn("transition-colors duration-500", active ? "text-blue-600" : "text-slate-400")}>
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 italic">{label}</span>
      </div>
      <button 
        onClick={() => onChange(!active)}
        className={cn(
          "w-12 h-6 rounded-full transition-all relative border-2",
          active ? "bg-blue-600 border-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]" : "bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600"
        )}
      >
        <div className={cn(
          "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-md",
          active ? "left-6" : "left-0.5"
        )} />
      </button>
    </div>
  );
}