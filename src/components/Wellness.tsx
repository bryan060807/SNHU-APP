import React, { useState } from 'react';
import { HeartPulse, Brain, Smile, Zap, Coffee, Phone, Frown, Meh, Laugh } from 'lucide-react';
import { MoodCheckIn } from '../types';

export function Wellness() {
  const [stress, setStress] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [focus, setFocus] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState('');
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  React.useEffect(() => {
    const existing = JSON.parse(localStorage.getItem('moodCheckIns') || '[]');
    const lastCheckIn = existing.length > 0 ? existing[existing.length - 1] : null;
    const isToday = lastCheckIn && new Date(lastCheckIn.timestamp).toDateString() === new Date().toDateString();
    setHasCheckedInToday(!!isToday);
  }, []);

  const handleSubmit = () => {
    const checkIn: MoodCheckIn = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      stress,
      energy,
      focus,
      notes
    };
    
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('moodCheckIns') || '[]');
    localStorage.setItem('moodCheckIns', JSON.stringify([...existing, checkIn]));
    
    setHasCheckedInToday(true);
    alert('Check-in saved!');
    setNotes('');
  };

  const RatingScale = ({ label, value, onChange }: { label: string, value: number, onChange: (v: 1 | 2 | 3 | 4 | 5) => void }) => (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v as 1 | 2 | 3 | 4 | 5)}
            className={cn(
              "w-10 h-10 rounded-xl font-bold transition-all",
              value === v ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Wellness & Mental Health</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Your well-being is our priority. Take a moment to check in.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <Smile size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Check-in</h3>
          </div>
          
          {hasCheckedInToday ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 font-medium">
              You've already checked in today. See you tomorrow!
            </div>
          ) : (
            <>
              <RatingScale label="Stress Level" value={stress} onChange={setStress} />
              <RatingScale label="Energy Level" value={energy} onChange={setEnergy} />
              <RatingScale label="Focus Level" value={focus} onChange={setFocus} />
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes on how you're feeling?"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                rows={3}
              />
              
              <button 
                onClick={handleSubmit}
                className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all"
              >
                Submit Check-in
              </button>
            </>
          )}
        </section>

        <section className="space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <Phone size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Resources</h3>
            </div>
            <div className="space-y-4">
              <a href="https://hub.mantrahealth.com/home" target="_blank" rel="noreferrer" className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600">MantraCare Wellness Hub</a>
              <a href="https://v2.togetherall.com/" target="_blank" rel="noreferrer" className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600">Togetherall</a>
              <a href="https://www.7cups.com/" target="_blank" rel="noreferrer" className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600">7 Cups</a>
            </div>
          </section>

          <section className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-xl shadow-red-900/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
                <Phone size={24} />
              </div>
              <h3 className="text-xl font-bold text-red-900 dark:text-white">Need help now?</h3>
            </div>
            <a href="tel:988" className="block w-full text-center p-4 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-all">Crisis Hotline: 988</a>
          </section>
        </section>
      </div>
    </div>
  );
}

// Helper for cn (need to import it)
import { cn } from '../lib/utils';
