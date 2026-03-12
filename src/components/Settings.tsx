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
  const [aiKnowledgeBase, setAiKnowledgeBase] = useState(user?.ai_knowledge_base || '');
  const [aiMemory, setAiMemory] = useState(user?.ai_memory || '');
  const [aiVoice, setAiVoice] = useState(user?.ai_voice || 'Kore');
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
    'Casual Peer': 'Be a casual, friendly peer. Use simple language, be relatable, and keep things lighthearted.'
  };

  const applyPreset = (preset: keyof typeof personalizationPresets) => {
    setAiPersonalization(personalizationPresets[preset]);
  };

  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
      setTheme(user.theme || 'dark');
      setAiPersonalization(user.ai_personalization || '');
      setAiKnowledgeBase(user.ai_knowledge_base || '');
      setAiMemory(user.ai_memory || '');
      setAiVoice(user.ai_voice || 'Kore');
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
          // SCOPES: Space-separated string including Drive metadata
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
          queryParams: { 
            access_type: 'offline', 
            prompt: 'consent' // Ensures permission checkboxes appear
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
          ai_knowledge_base: aiKnowledgeBase,
          ai_memory: aiMemory,
          ai_voice: aiVoice,
          wellness_enabled: wellnessEnabled,
          birthday: birthday || null,
        });

      if (error) throw error;

      // THEME PERSISTENCE: Save to localStorage for the index.html boot script
      localStorage.setItem('theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      updateUser({ 
        full_name: name, 
        theme, 
        ai_personalization: aiPersonalization, 
        ai_knowledge_base: aiKnowledgeBase, 
        ai_memory: aiMemory,
        ai_voice: aiVoice,
        wellness_enabled: wellnessEnabled,
        birthday,
      });

      showToast('Success', 'Settings synced and encrypted', 'success');
      
    } catch (error: any) {
      showToast('Error', error.message || 'Failed to update settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Control Center</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">System Personalization & Neural Links</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-6 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl font-black uppercase text-xs transition-all border-2 border-transparent hover:border-rose-500"
        >
          <LogOut size={18} />
          <span>Terminate Session</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <User size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Biometric Data</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Label</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-bold outline-none focus:border-blue-500"
                  placeholder="Bryan Miller"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origin Date (Birthday)</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-bold outline-none"
                />
              </div>
            </div>
          </section>

          {/* AI Buddy Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Brain size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Neural Buddy Config</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personality Matrix</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(personalizationPresets).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => applyPreset(preset as keyof typeof personalizationPresets)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  value={aiPersonalization}
                  onChange={(e) => setAiPersonalization(e.target.value)}
                  rows={3}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-medium outline-none focus:border-blue-500"
                  placeholder="Define the AI's core behavior..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Long-Term Memory / Bio</label>
                <textarea
                  value={aiMemory}
                  onChange={(e) => setAiMemory(e.target.value)}
                  rows={3}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-medium outline-none focus:border-blue-500"
                  placeholder="Key facts the AI should always remember about you..."
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Google Integration Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">Google Link</h3>
              <div className={cn("w-3 h-3 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]", isGoogleConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
            </div>

            {isGoogleConnected ? (
              <div className="space-y-4">
                <IntegrationToggle icon={<Calendar size={18}/>} label="Calendar Sync" active={syncCalendar} onChange={setSyncCalendar} />
                <IntegrationToggle icon={<Layout size={18}/>} label="Task Sync" active={syncTasks} onChange={setSyncTasks} />
                <IntegrationToggle icon={<HardDrive size={18}/>} label="Drive Access" active={syncDrive} onChange={setSyncDrive} />
                <button 
                  onClick={handleConnectGoogle}
                  className="w-full py-3 text-[10px] font-black uppercase text-slate-400 hover:text-blue-500 transition-colors"
                >
                  Refresh Permissions
                </button>
              </div>
            ) : (
              <button 
                onClick={handleConnectGoogle}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 hover:border-blue-500 transition-all shadow-sm"
              >
                <Database size={18} className="text-blue-500" />
                Authorize Google
              </button>
            )}
          </section>

          {/* Theme Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">Visuals</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.5rem] border-2 border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  theme === 'light' ? "bg-white text-blue-600 shadow-lg" : "text-slate-500"
                )}
              >
                <Sun size={16} /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  theme === 'dark' ? "bg-slate-700 text-white shadow-lg" : "text-slate-500"
                )}
              >
                <Moon size={16} /> Dark
              </button>
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30 disabled:opacity-50 active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={24} /> <span>Sync All Systems</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationToggle({ icon, label, active, onChange }: { icon: any, label: string, active: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className={cn("text-slate-400", active && "text-blue-500")}>{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{label}</span>
      </div>
      <button 
        onClick={() => onChange(!active)}
        className={cn(
          "w-10 h-6 rounded-full transition-all relative",
          active ? "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" : "bg-slate-300 dark:bg-slate-700"
        )}
      >
        <div className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
          active ? "left-5" : "left-1"
        )} />
      </button>
    </div>
  );
}