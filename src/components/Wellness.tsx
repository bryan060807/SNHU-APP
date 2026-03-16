/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  HeartPulse, 
  Brain, 
  Zap, 
  Wind, 
  TrendingDown, 
  Save,
  BarChart3,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

export function Wellness() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Local Biometric State
  const [stressLevel, setStressLevel] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [sleepHours, setSleepHours] = useState(7);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * DATA PERSISTENCE: handleLogBiometrics
   * Pushes current state to the public.biometrics table.
   */
  const handleLogBiometrics = async () => {
    if (!user) return;
    setIsSyncing(true);

    const burnoutRisk = calculateRisk(stressLevel, energyLevel);

    try {
      const { error } = await supabase
        .from('biometrics')
        .insert([{
          user_id: user.id,
          stress_level: stressLevel,
          energy_level: energyLevel,
          sleep_hours: sleepHours,
          burnout_risk: burnoutRisk
        }]);

      if (error) throw error;
      
      showToast('Biometrics Synced', 'Neural stress levels updated in mainframe.', 'success');
    } catch (err: any) {
      console.error('Biometric Sync Error:', err.message);
      showToast('Sync Error', 'Failed to log biometric data to database.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const calculateRisk = (stress: number, energy: number) => {
    if (stress > 7 || energy < 3) return 'High';
    if (stress > 4) return 'Moderate';
    return 'Low';
  };

  const burnoutRisk = calculateRisk(stressLevel, energyLevel);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Biometric Monitor</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Neural Stress & Recovery Tracking</p>
        </div>
        
        <div className={cn(
          "px-6 py-3 rounded-[2rem] border-2 shadow-xl flex items-center gap-3 transition-all duration-500",
          burnoutRisk === 'High' 
            ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900 shadow-rose-500/10" 
            : "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900 shadow-emerald-500/10"
        )}>
          <div className="relative flex items-center justify-center w-4 h-4">
            <div className="absolute w-full h-full bg-current rounded-full animate-ping opacity-20" />
            <div className="w-2 h-2 bg-current rounded-full" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest italic">System Status: {burnoutRisk} Risk</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Input Module */}
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl space-y-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
              <HeartPulse size={24} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Manual Extraction</h3>
          </div>

          <div className="space-y-12">
            <MetricSlider 
              label="Cognitive Load (Stress)" 
              value={stressLevel} 
              onChange={setStressLevel} 
              min={1} max={10} 
              icon={<Brain size={18} />}
              color="text-rose-500"
              accent="accent-rose-500"
            />
            <MetricSlider 
              label="Physical Voltage (Energy)" 
              value={energyLevel} 
              onChange={setEnergyLevel} 
              min={1} max={10} 
              icon={<Zap size={18} />}
              color="text-blue-500"
              accent="accent-blue-600"
            />
            <MetricSlider 
              label="Recovery Cycles (Sleep)" 
              value={sleepHours} 
              onChange={setSleepHours} 
              min={0} max={12} 
              unit="h"
              icon={<Wind size={18} />}
              color="text-emerald-500"
              accent="accent-emerald-500"
            />
          </div>

          <button 
            onClick={handleLogBiometrics}
            disabled={isSyncing}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:opacity-90 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 group"
          >
            {isSyncing ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Save size={24} className="group-hover:scale-110 transition-transform" /> 
                <span>Sync Biometrics</span>
              </>
            )}
          </button>
        </section>

        {/* Advisory Module */}
        <div className="space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
              <BarChart3 size={16} /> Analysis Report
            </h4>
            <div className="space-y-4">
              <AnalysisRow label="Neural Stability" status={stressLevel < 6 ? 'Stable' : 'Critical'} color={stressLevel < 6 ? 'text-emerald-500' : 'text-rose-500'} />
              <AnalysisRow label="Output Capacity" status={energyLevel > 4 ? 'Optimal' : 'Low'} color={energyLevel > 4 ? 'text-blue-500' : 'text-amber-500'} />
              <AnalysisRow label="Recovery Phase" status={sleepHours >= 7 ? 'Complete' : 'Deficit'} color={sleepHours >= 7 ? 'text-emerald-500' : 'text-rose-500'} />
            </div>
          </section>

          <section className="bg-slate-900 dark:bg-blue-950 p-8 rounded-[2.5rem] border-2 border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/20 transition-all" />
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
              <TrendingDown size={16} /> Recovery Protocol
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-bold italic uppercase tracking-tighter relative z-10">
              {burnoutRisk === 'High' 
                ? "WARNING: System overheating. Terminate non-essential tasks immediately. Neural drift detected. High recovery required."
                : "Operational parameters nominal. Maintain current engagement levels for maximum term saturation. System stable."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

// Sub-Components
function MetricSlider({ label, value, onChange, min, max, icon, color, accent, unit = "" }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={cn("p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700", color)}>
            {icon}
          </div>
          <label className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
            {label}
          </label>
        </div>
        <span className={cn("text-2xl font-black italic tabular-nums", color)}>
          {value}{unit}
        </span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={cn(
          "w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer transition-all",
          accent
        )}
      />
    </div>
  );
}

function AnalysisRow({ label, status, color }: any) {
  return (
    <div className="flex justify-between items-center py-3 border-b-2 border-slate-50 dark:border-slate-800/50 last:border-0">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={cn("text-[10px] font-black uppercase tracking-widest italic", color)}>{status}</span>
    </div>
  );
}