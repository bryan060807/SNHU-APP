import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Moon, Sun, Brain, Database, Save, LogOut, Shield, Loader2, HeartPulse } from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

export function Settings() {
  const { user, token, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [theme, setTheme] = useState<'light' | 'dark'>(user?.theme || 'light');
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
  React.useEffect(() => {
    if (user && !name && !aiPersonalization) { // Only sync if local state is empty/initial
      setName(user.name || '');
      setTheme(user.theme || 'light');
      setAiPersonalization(user.ai_personalization || '');
      setAiKnowledgeBase(user.ai_knowledge_base || '');
      setAiMemory(user.ai_memory || '');
      setAiVoice(user.ai_voice || 'Kore');
      setBirthday(user.birthday || '');
    }
  }, [user]);

  React.useEffect(() => {
    const checkGoogleStatus = async () => {
      const response = await fetch('/api/google/status', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      setIsGoogleConnected(data.connected);
    };
    checkGoogleStatus();
  }, [token]);

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
      const response = await fetch(`/api/auth/google/url?userId=${user?.id}`);
      const { url } = await response.json();
      const authWindow = window.open(url, 'google_auth', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          showToast('Success', 'Google account connected', 'success');
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (error) {
      showToast('Error', 'Failed to connect Google account', 'error');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          theme,
          ai_personalization: aiPersonalization,
          ai_knowledge_base: aiKnowledgeBase,
          ai_memory: aiMemory,
          ai_voice: aiVoice,
          wellness_enabled: wellnessEnabled,
          birthday,
        }),
      });

      if (response.ok) {
        updateUser({ 
          name, 
          theme, 
          ai_personalization: aiPersonalization, 
          ai_knowledge_base: aiKnowledgeBase, 
          ai_memory: aiMemory,
          ai_voice: aiVoice,
          wellness_enabled: wellnessEnabled,
          birthday,
        });
        showToast('Success', 'Settings updated successfully', 'success');
        
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        showToast('Error', 'Failed to update settings', 'error');
      }
    } catch (error) {
      showToast('Error', 'Failed to connect to server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Personalize your SNHU Academic Compass experience.</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-all"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <User size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Profile Setup</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Birthday</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Birthday</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 ml-1">Email cannot be changed at this time.</p>
              </div>
            </div>
          </section>

          {/* AI Buddy Settings */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                <Brain size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Buddy Personalization</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">AI Personality</label>
                <div className="flex gap-2 mb-2">
                  {Object.keys(personalizationPresets).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyPreset(preset as keyof typeof personalizationPresets)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  value={aiPersonalization}
                  onChange={(e) => setAiPersonalization(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white resize-none"
                  placeholder="e.g. Be a supportive mentor who uses academic language but keeps it encouraging."
                />
                <p className="text-[10px] text-slate-400 ml-1">Describe how you want your AI Buddy to interact with you.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Knowledge Base Context</label>
                <textarea
                  value={aiKnowledgeBase}
                  onChange={(e) => setAiKnowledgeBase(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white resize-none"
                  placeholder="e.g. I am a Computer Science major focusing on Software Engineering. I prefer Python and Java."
                />
                <p className="text-[10px] text-slate-400 ml-1">Provide background info about your major or learning style.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Long-term Memory</label>
                <textarea
                  value={aiMemory}
                  onChange={(e) => setAiMemory(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white resize-none"
                  placeholder="e.g. Remember that I work full-time and usually study late at night."
                />
                <p className="text-[10px] text-slate-400 ml-1">Key facts the AI should always remember about your schedule or preferences.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">AI Voice Assistant</label>
                <select
                  value={aiVoice}
                  onChange={(e) => setAiVoice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
                >
                  <option value="Kore">Kore (Balanced, Female)</option>
                  <option value="Puck">Puck (Cheerful, Female)</option>
                  <option value="Charon">Charon (Deep, Male)</option>
                  <option value="Fenrir">Fenrir (Strong, Male)</option>
                  <option value="Zephyr">Zephyr (Soft, Male)</option>
                </select>
                <p className="text-[10px] text-slate-400 ml-1">Choose the voice for Talk Mode.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
          {/* Integrations Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <Database size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Integrations</h3>
            </div>
            
            <button
              onClick={handleConnectGoogle}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl text-sm font-bold transition-all",
                isGoogleConnected 
                  ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <span>{isGoogleConnected ? 'Google Connected' : 'Connect Google Calendar & Drive'}</span>
              <span className="text-xs">{isGoogleConnected ? 'Connected' : 'Connect'}</span>
            </button>
          </section>

          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                <Sun size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Appearance</h3>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                onClick={() => toggleTheme('light')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
                  theme === 'light' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                )}
              >
                <Sun size={18} />
                <span>Light</span>
              </button>
              <button
                onClick={() => toggleTheme('dark')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
                  theme === 'dark' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                )}
              >
                <Moon size={18} />
                <span>Dark</span>
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                <Database size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Data & Privacy</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <HeartPulse className="text-emerald-600 dark:text-emerald-400" size={20} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Enable Wellness Features</span>
                </div>
                <button
                  onClick={() => setWellnessEnabled(!wellnessEnabled)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    wellnessEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    wellnessEnabled ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <Shield className="text-emerald-600 dark:text-emerald-400 shrink-0" size={20} />
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Your data is stored securely in our private database.</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                All course info, assignments, and AI buddy settings are synced to your account and available across all your devices.
              </p>
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-[#003057] text-white py-4 rounded-[2rem] font-bold flex items-center justify-center gap-3 hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Save size={24} />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
