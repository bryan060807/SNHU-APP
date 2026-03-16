/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HeartPulse, Brain, Smile, Activity, Coffee, Phone, Frown, Meh, Laugh } from 'lucide-react';
import { MoodCheckIn } from '../types';
import { cn } from '../lib/utils';

export function Wellness() {
  const [stress, setStress] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [focus, setFocus] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState('');
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  useEffect(() => {
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
            type="button"
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
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Wellness & Mental Health</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Your well-being is the core of the system. Take a moment to check in.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center border-2 border-emerald-100 dark:border-emerald-800">
              <Smile size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Daily Check-in</h3>
          </div>
          
          {hasCheckedInToday ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">
              Biometric sync complete for today. See you tomorrow.
            </div>
          ) : (
            <>
              <RatingScale label="Stress Level" value={stress} onChange={setStress} />
              <RatingScale label="Energy Level" value={energy} onChange={setEnergy} />
              <RatingScale label="Focus Level" value={focus} onChange={setFocus} />
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes on the current operational state?"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-blue-500 dark:text-white font-medium text-sm"
                rows={3}
              />
              
              <button 
                onClick={handleSubmit}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                Submit Check-in
              </button>
            </>
          )}
        </section>

        <section className="space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border-2 border-blue-100 dark:border-blue-800">
                <Brain size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Resources</h3>
            </div>
            <div className="space-y-4">
              <a href="https://hub.mantrahealth.com/home" target="_blank" rel="noreferrer" className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 border border-transparent hover:border-blue-500 transition-all">MantraCare Wellness Hub</a>
              <a href="https://v2.togetherall.com/" target="_blank" rel="noreferrer" className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 border border-transparent hover:border-blue-500 transition-all">Togetherall</a>
              <a href="https://www.7cups.com/" target="_blank" rel="noreferrer" className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 border border-transparent hover:border-blue-500 transition-all">7 Cups</a>
            </div>
          </section>

          <section className="bg-rose-50 dark:bg-rose-900/10 p-8 rounded-[2.5rem] border-2 border-rose-100 dark:border-rose-900/30 shadow-xl shadow-rose-900/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center border-2 border-rose-100 dark:border-rose-800">
                <Phone size={24} />
              </div>
              <h3 className="text-xl font-black text-rose-900 dark:text-white uppercase italic">Emergency Sync</h3>
            </div>
            <a href="tel:988" className="block w-full text-center py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20">Crisis Hotline: 988</a>
          </section>
        </section>
      </div>
    </div>
  );
}