/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Moon, Sun, Brain, Database, Save, LogOut, Shield, Loader2, HeartPulse } from 'lucide-react';
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
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  const personalizationPresets = {
    'Supportive Mentor': 'Be a supportive, encouraging mentor. Use academic language but keep it warm and motivating.',
    'Strict Taskmaster': 'Be a strict, focused taskmaster. Keep interactions brief, prioritize deadlines, and push me to be productive.',
    'Casual Peer': 'Be a casual, friendly peer. Use simple language, be relatable, and keep things lighthearted.'
  };

  const applyPreset = (preset: keyof typeof personalizationPresets) => {
    setAiPersonalization(personalizationPresets[preset]);
  };

  // Sync state with user context on initial load
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

  // Check Google Status via Supabase Auth Metadata
  useEffect(() => {
    const checkGoogleStatus = async () => {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      const isConnected = sbUser?.app_metadata?.providers?.includes('google') || false;
      setIsGoogleConnected(isConnected);
    };
    checkGoogleStatus();
  }, []);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: { access_type: 'offline', prompt: 'consent' },
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      showToast('Error', 'Failed to initiate Google connection', 'error');
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

      showToast('Success', 'Settings synced to Supabase', 'success');
      
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error: any) {
      showToast('Error', error.message || 'Failed to update settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Personalize your SNHU Compass experience.</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-bold transition-all"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <User size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Profile Setup</h3>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  placeholder="Bryan Miller"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birthday</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white"
                />
              </div>

              <div className="space-y-1 opacity-60">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                <Brain size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Buddy Tuning</h3>
            </div>

            <div className="space-y-6 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personality Preset</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.keys(personalizationPresets).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyPreset(preset as keyof typeof personalizationPresets)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  value={aiPersonalization}
                  onChange={(e) => setAiPersonalization(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white resize-none"
                  placeholder="Describe your mentor style..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AI Voice Profile</label>
                <select
                  value={aiVoice}
                  onChange={(e) => setAiVoice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white"
                >
                  <option value="Kore">Kore (Balanced, Female)</option>
                  <option value="Puck">Puck (Cheerful, Female)</option>
                  <option value="Charon">Charon (Deep, Male)</option>
                  <option value="Fenrir">Fenrir (Strong, Male)</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Appearance</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                onClick={() => toggleTheme('light')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
                  theme === 'light' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
                )}
              >
                <Sun size={18} /> <span>Light</span>
              </button>
              <button
                onClick={() => toggleTheme('dark')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
                  theme === 'dark' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500"
                )}
              >
                <Moon size={18} /> <span>Dark</span>
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Wellness</h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
               <div className="flex items-center gap-3">
                  <HeartPulse className="text-emerald-500" size={20} />
                  <span className="text-xs font-bold dark:text-white">Focus Mode Alerts</span>
               </div>
               <button
                  onClick={() => setWellnessEnabled(!wellnessEnabled)}
                  className={cn(
                    "w-10 h-5 rounded-full transition-all relative",
                    wellnessEnabled ? "bg-emerald-500" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                    wellnessEnabled ? "left-5" : "left-1"
                  )} />
                </button>
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={24} /> <span>Sync All Settings</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}