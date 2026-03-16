/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, Brain, Zap, Wind, TrendingDown, Save, 
  BarChart3, Loader2, History, Info, ShieldAlert,
  ChevronRight, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export function Wellness() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Input State
  const [stressLevel, setStressLevel] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [sleepHours, setSleepHours] = useState(7);
  
  // System State
  const [isSyncing, setIsSyncing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('biometrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setHistory(data || []);
    } catch (err: any) {
      console.error('History Fetch Error:', err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

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
      
      showToast('Biometrics Synced', 'Neural stress levels updated.', 'success');
      fetchHistory(); // Refresh the visual log
    } catch (err: any) {
      showToast('Sync Error', 'Failed to log biometric data.', 'error');
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
  const neuralBalance = Math.round(((energyLevel + (10 - stressLevel) + (sleepHours / 1.2)) / 30) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Biometric Monitor</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 flex items-center gap-2">
            <ActivityPulse color={burnoutRisk === 'High' ? 'bg-rose-500' : 'bg-emerald-500'} />
            Neural Stress & Recovery Tracking // v2.1
          </p>
        </div>
        
        <div className="flex gap-4">
          <MetricBadge label="Balance" value={`${neuralBalance}%`} color="text-blue-600" />
          <MetricBadge label="Risk" value={burnoutRisk} color={burnoutRisk === 'High' ? 'text-rose-500' : 'text-emerald-500'} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Data Entry */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl space-y-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <HeartPulse size={120} />
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                <RefreshCw size={28} className={cn(isSyncing && "animate-spin")} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Manual Extraction</h3>
            </div>

            <div className="grid grid-cols-1 gap-12 relative z-10">
              <MetricSlider 
                label="Cognitive Load" 
                sub="Mental stress & academic pressure"
                value={stressLevel} onChange={setStressLevel} 
                min={1} max={10} icon={<Brain size={20} />}
                color="text-rose-500" accent="accent-rose-500"
              />
              <MetricSlider 
                label="Physical Voltage" 
                sub="Current energy & alertness levels"
                value={energyLevel} onChange={setEnergyLevel} 
                min={1} max={10} icon={<Zap size={20} />}
                color="text-blue-500" accent="accent-blue-600"
              />
              <MetricSlider 
                label="Recovery Cycles" 
                sub="Sleep duration in the last 24h"
                value={sleepHours} onChange={setSleepHours} 
                min={0} max={12} unit="h" icon={<Wind size={20} />}
                color="text-emerald-500" accent="accent-emerald-500"
              />
            </div>

            <button 
              onClick={handleLogBiometrics}
              disabled={isSyncing}
              className="w-full bg-slate-900 dark:bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:opacity-90 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 group"
            >
              {isSyncing ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24} className="group-hover:translate-y-[-2px] transition-transform" /> <span>Sync Biometrics</span></>}
            </button>
          </section>

          {/* SNHU Contextual Advice */}
          <section className="bg-slate-900 dark:bg-blue-950 p-10 rounded-[3rem] border-2 border-slate-800 shadow-2xl flex flex-col md:flex-row items-center gap-8">
            <div className={cn(
              "w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 border-2",
              burnoutRisk === 'High' ? "bg-rose-500/10 border-rose-500/50 text-rose-500" : "bg-blue-500/10 border-blue-500/50 text-blue-500"
            )}>
              {burnoutRisk === 'High' ? <ShieldAlert size={40} /> : <Info size={40} />}
            </div>
            <div className="space-y-2 text-center md:text-left">
              <h4 className="text-lg font-black text-white uppercase italic tracking-tight">Academic Advisory</h4>
              <p className="text-sm text-slate-400 font-bold leading-relaxed uppercase tracking-tight italic">
                {burnoutRisk === 'High' 
                  ? "CRITICAL: Brain saturation reached. Stop coding/writing immediately. Use the Focus Engine for 5-minute recovery cycles. Term performance depends on rest."
                  : "NOMINAL: System stable. Optimal window for SNHU Discussion posts and Milestone drafting. Maximize current output."}
              </p>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: History & Reports */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                <History size={16} /> Extraction Log
              </h4>
              <button onClick={fetchHistory} className="text-slate-300 hover:text-blue-500 transition-colors">
                <RefreshCw size={14} className={isLoadingHistory ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode='popLayout'>
                {history.length > 0 ? (
                  history.map((log, idx) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          {format(new Date(log.created_at), 'MMM d, h:mm a')}
                        </p>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic">
                          Balance: {Math.round(((log.energy_level + (10 - log.stress_level)) / 20) * 100)}%
                        </p>
                      </div>
                      <div className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest",
                        log.burnout_risk === 'High' ? "bg-rose-500 text-white" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {log.burnout_risk}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center opacity-30">
                    <BarChart3 size={40} className="mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Logs Found</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Analysis Module */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
              <BarChart3 size={16} /> Neural Analysis
            </h4>
            <div className="space-y-4">
              <AnalysisRow label="Neural Stability" status={stressLevel < 6 ? 'Stable' : 'Critical'} color={stressLevel < 6 ? 'text-emerald-500' : 'text-rose-500'} />
              <AnalysisRow label="Output Capacity" status={energyLevel > 4 ? 'Optimal' : 'Low'} color={energyLevel > 4 ? 'text-blue-500' : 'text-amber-500'} />
              <AnalysisRow label="Recovery Phase" status={sleepHours >= 7 ? 'Complete' : 'Deficit'} color={sleepHours >= 7 ? 'text-emerald-500' : 'text-rose-500'} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Sub-Components
function MetricSlider({ label, sub, value, onChange, min, max, icon, color, accent, unit = "" }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm", color)}>
            {icon}
          </div>
          <div className="space-y-0.5">
            <label className="text-md font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{label}</label>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{sub}</p>
          </div>
        </div>
        <span className={cn("text-3xl font-black italic tabular-nums", color)}>{value}{unit}</span>
      </div>
      <input 
        type="range" min={min} max={max} value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={cn("w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer", accent)}
      />
    </div>
  );
}

function MetricBadge({ label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-center min-w-[100px]">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={cn("text-xl font-black italic uppercase tracking-tighter", color)}>{value}</span>
    </div>
  );
}

function AnalysisRow({ label, status, color }: any) {
  return (
    <div className="flex justify-between items-center py-3 border-b-2 border-slate-50 dark:border-slate-800/50 last:border-0 group">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-[10px] font-black uppercase tracking-widest italic", color)}>{status}</span>
        <ChevronRight size={12} className="text-slate-200" />
      </div>
    </div>
  );
}

function ActivityPulse({ color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      <div className={cn("absolute w-full h-full rounded-full animate-ping opacity-20", color)} />
      <div className={cn("w-2 h-2 rounded-full", color)} />
    </div>
  );
}