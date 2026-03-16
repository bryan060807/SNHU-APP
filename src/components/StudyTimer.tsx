/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Course } from '../types';
import { Play, Pause, RotateCcw, Coffee, Brain, Bell, Zap, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { requestNotificationPermission, sendNotification } from '../lib/notifications';
import { useToast } from './Toast';

interface StudyTimerProps {
  courses: Course[];
}

export function StudyTimer({ courses }: StudyTimerProps) {
  const { showToast } = useToast();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Notification State Sync
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    sendNotification(mode === 'study' ? 'Extraction Cycle Complete!' : 'Recovery Period Over!', {
      body: mode === 'study' ? 'System cool-down initiated. Take 5.' : 'Voltage stabilized. Resume extraction.',
    }, showToast);

    if (mode === 'study') {
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      setMode('study');
      setTimeLeft(25 * 60);
    }
  };

  /**
   * REBAR FIX: requestPermission logic
   * This clears the ReferenceError by using the imported requestNotificationPermission properly.
   */
  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Hardware Error', 'System notifications not supported on this terminal.', 'error');
      return;
    }

    try {
      showToast('Relay Request', 'Initializing notification handshake...', 'info');
      const permission = await requestNotificationPermission();
      setNotifPermission(permission);
      
      if (permission === 'granted') {
        sendNotification('SNHU Compass: Relay Active', {
          body: 'Focus Engine alerts are now synchronized.',
        }, showToast);
      } else if (permission === 'denied') {
        showToast('Link Blocked', 'Permissions denied. Check browser settings.', 'error');
      }
    } catch (error) {
      console.error('Notification Error:', error);
      showToast('Relay Failure', 'Connection to notification system failed.', 'error');
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'study' ? 25 * 60 : 5 * 60);
    showToast('Timer Reset', 'Clock cycles re-synchronized.', 'info');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (mode === 'study' ? (25 * 60 - timeLeft) / (25 * 60) : (5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="text-center">
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Focus Engine</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Manage cognitive load with high-intensity cycles</p>
      </header>

      <div className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-blue-900/10 flex flex-col items-center space-y-10 relative overflow-hidden transition-all hover:border-blue-500/30">
        
        {/* Mode Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl w-full max-w-sm border-2 border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => { setMode('study'); setTimeLeft(25 * 60); setIsActive(false); }}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
              mode === 'study' ? "bg-blue-600 text-white shadow-xl" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <Zap size={16} /> <span>Extraction</span>
          </button>
          <button 
            onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
              mode === 'break' ? "bg-emerald-600 text-white shadow-xl" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <Coffee size={16} /> <span>Recovery</span>
          </button>
        </div>

        {/* Visual Timer Ring */}
        <div className="relative w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="50%" cy="50%" r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-50 dark:text-slate-800/50"
            />
            <motion.circle
              cx="50%" cy="50%" r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray="282.7%"
              animate={{ strokeDashoffset: `${282.7 * (1 - progress / 100)}%` }}
              className={cn(
                "transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.1)]",
                mode === 'study' ? "text-blue-600" : "text-emerald-500"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter italic">
              {formatTime(timeLeft)}
            </span>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mt-4 border-2",
              mode === 'study' ? "text-blue-600 border-blue-100 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800" : "text-emerald-600 border-emerald-100 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800"
            )}>
              {isActive ? <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> : null}
              {mode === 'study' ? 'Active Extraction' : 'System Recovery'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={resetTimer}
            className="w-14 h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:border-blue-600 transition-all active:scale-90"
          >
            <RotateCcw size={22} />
          </button>
          <button 
            onClick={toggleTimer}
            className={cn(
              "w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all transform active:scale-95 group",
              mode === 'study' ? "bg-blue-600 shadow-blue-600/30" : "bg-emerald-600 shadow-emerald-600/30"
            )}
          >
            {isActive ? <Pause size={32} className="group-hover:scale-110 transition-transform" fill="currentColor" /> : <Play size={32} className="ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />}
          </button>
          <button 
            onClick={handleRequestPermission}
            className={cn(
              "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-90",
              notifPermission === 'granted' 
                ? "border-emerald-500 text-emerald-500" 
                : "border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:border-blue-600"
            )}
          >
            <Bell size={22} />
          </button>
        </div>

        {/* Target Module Selector */}
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-2 ml-1">
            <Target size={14} className="text-slate-400" />
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Extraction Target</label>
          </div>
          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-blue-600 font-black uppercase text-xs tracking-tight text-slate-700 dark:text-slate-200 transition-all italic"
          >
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} // {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Logic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl">
          <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-widest flex items-center gap-2">
            <Brain size={16} /> Cognitive Protocol
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold uppercase tracking-tighter italic">
            Studying in 25-minute high-voltage bursts prevents neural burnout and maximizes data retention for complex SNHU modules.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl">
          <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 mb-3 uppercase tracking-widest flex items-center gap-2">
            <RotateCcw size={16} /> Cool-down Phase
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold uppercase tracking-tighter italic">
            Disconnect from all visual terminals during recovery. Hydrate, stretch, and stabilize voltage before the next cycle.
          </p>
        </div>
      </div>
    </div>
  );
}