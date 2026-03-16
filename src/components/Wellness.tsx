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
  AlertTriangle, 
  CheckCircle2,
  Save,
  BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useToast } from './Toast';

export function Wellness() {
  const { showToast } = useToast();
  const [stressLevel, setStressLevel] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [sleepHours, setSleepHours] = useState(7);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogBiometrics = () => {
    setIsSyncing(true);
    // Logic: Simulating a database push
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Biometrics Synced', 'Neuro-stress levels updated in mainframe.', 'success');
    }, 1000);
  };

  const burnoutRisk = stressLevel > 7 || energyLevel < 3 ? 'High' : stressLevel > 4 ? 'Moderate' : 'Low';

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Biometric Monitor</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Neural Stress & Recovery Tracking</p>
        </div>
        
        <div className={cn(
          "px-6 py-3 rounded-[2rem] border-2 shadow-xl flex items-center gap-3 transition-all",
          burnoutRisk === 'High' ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900" : "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900"
        )}>
          <ActivityPulse />
          <span className="text-xs font-black uppercase tracking-widest">System Status: {burnoutRisk} Risk</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Module */}
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
              <Brain size={24} />
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
            />
            <MetricSlider 
              label="Physical Voltage (Energy)" 
              value={energyLevel} 
              onChange={setEnergyLevel} 
              min={1} max={10} 
              icon={<Zap size={18} />}
              color="text-blue-500"
            />
            <MetricSlider 
              label="Recovery Cycles (Sleep)" 
              value={sleepHours} 
              onChange={setSleepHours} 
              min={0} max={12} 
              unit="h"
              icon={<Wind size={18} />}
              color="text-emerald-500"
            />
          </div>

          <button 
            onClick={handleLogBiometrics}
            disabled={isSyncing}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:opacity-90 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50"
          >
            {isSyncing ? <LoaderRing /> : <><Save size={24} /> <span>Log Biometrics</span></>}
          </button>
        </section>

        {/* Advisory Module */}
        <div className="space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={16} /> Analysis
            </h4>
            <div className="space-y-4">
              <AnalysisRow label="Neural Stability" status={stressLevel < 6 ? 'Stable' : 'Critical'} color={stressLevel < 6 ? 'text-emerald-500' : 'text-rose-500'} />
              <AnalysisRow label="Output Capacity" status={energyLevel > 4 ? 'Optimal' : 'Low'} color={energyLevel > 4 ? 'text-blue-500' : 'text-amber-500'} />
              <AnalysisRow label="Recovery Phase" status={sleepHours >= 7 ? 'Complete' : 'Deficit'} color={sleepHours >= 7 ? 'text-emerald-500' : 'text-rose-500'} />
            </div>
          </section>

          <section className="bg-slate-900 dark:bg-blue-950 p-8 rounded-[2.5rem] border-2 border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
              <TrendingDown size={16} /> Recovery Protocol
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-bold italic uppercase tracking-tighter relative z-10">
              {burnoutRisk === 'High' 
                ? "WARNING: System overheating. Terminate non-essential tasks immediately. Increase recovery cycles."
                : "Operational parameters nominal. Maintain current engagement levels for maximum term saturation."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

// Sub-Components for Industrial Cleanliness
function MetricSlider({ label, value, onChange, min, max, icon, color, unit = "" }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 bg-slate-100 dark:bg-slate-800 rounded-xl", color)}>{icon}</div>
          <label className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{label}</label>
        </div>
        <span className={cn("text-2xl font-black italic", color)}>{value}{unit}</span>
      </div>
      <input 
        type="range" min={min} max={max} value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}

function AnalysisRow({ label, status, color }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={cn("text-[10px] font-black uppercase tracking-widest", color)}>{status}</span>
    </div>
  );
}

function ActivityPulse() {
  return (
    <div className="relative flex items-center justify-center w-4 h-4">
      <div className="absolute w-full h-full bg-current rounded-full animate-ping opacity-20" />
      <div className="w-2 h-2 bg-current rounded-full" />
    </div>
  );
}

function LoaderRing() {
  return <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}