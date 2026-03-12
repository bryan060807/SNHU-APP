import React, { useState, useEffect, useRef } from 'react';
import { Course } from '../types';
import { Play, Pause, RotateCcw, Coffee, Brain, Bell } from 'lucide-react';
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
    
    // Play sound or notification
    sendNotification(mode === 'study' ? 'Study Session Complete!' : 'Break Over!', {
      body: mode === 'study' ? 'Time for a well-deserved break.' : 'Ready to dive back in?',
    }, showToast);

    if (mode === 'study') {
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      setMode('study');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'study' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (mode === 'study' ? (25 * 60 - timeLeft) / (25 * 60) : (5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Focus Timer</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Use the Pomodoro technique to stay productive.</p>
      </header>

      <div className="bg-white dark:bg-slate-900 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 flex flex-col items-center space-y-8 relative overflow-hidden">
        {/* Background Decoration */}
        <div className={cn(
          "absolute top-0 left-0 w-full h-2 transition-colors duration-500",
          mode === 'study' ? "bg-blue-500" : "bg-emerald-500"
        )} />

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full max-w-xs">
          <button 
            onClick={() => { setMode('study'); setTimeLeft(25 * 60); setIsActive(false); }}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
              mode === 'study' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <Brain size={18} /> <span className="hidden sm:inline">Study Session</span><span className="sm:hidden">Study</span>
          </button>
          <button 
            onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
              mode === 'break' ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <Coffee size={18} /> <span className="hidden sm:inline">Short Break</span><span className="sm:hidden">Break</span>
          </button>
        </div>

        <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100 dark:text-slate-800"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray="282.7%"
              animate={{ strokeDashoffset: `${282.7 * (1 - progress / 100)}%` }}
              className={cn(
                "transition-colors duration-500",
                mode === 'study' ? "text-blue-500" : "text-emerald-500"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
              {mode === 'study' ? 'Focusing' : 'Resting'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={resetTimer}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <RotateCcw size={20} className="sm:w-6 sm:h-6" />
          </button>
          <button 
            onClick={toggleTimer}
            className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-white shadow-lg transition-all transform active:scale-95",
              mode === 'study' ? "bg-blue-600 shadow-blue-600/20" : "bg-emerald-600 shadow-emerald-600/20",
              isActive ? "hover:bg-opacity-90" : "hover:bg-opacity-90"
            )}
          >
            {isActive ? <Pause size={28} className="sm:w-8 sm:h-8" fill="currentColor" /> : <Play size={28} className="sm:w-8 sm:h-8 ml-1" fill="currentColor" />}
          </button>
          <button 
            onClick={() => {
              const Notification = (window as any).Notification;
              if (Notification && Notification.permission === 'granted') {
                sendNotification('SNHU Compass: Test Alert', {
                  body: 'Your study timer is working correctly!',
                }, showToast);
              } else {
                requestNotificationPermission().then(permission => {
                  if (permission === 'granted') {
                    sendNotification('SNHU Compass: Notifications Enabled', {
                      body: 'You will now receive alerts for your study sessions.',
                    }, showToast);
                  } else {
                    showToast('System Alert', 'Browser notifications are disabled, but in-app alerts are active!', 'info');
                  }
                });
              }
            }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <Bell size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-center">Focusing on</label>
          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-slate-700 dark:text-slate-200"
          >
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Why Pomodoro?</h4>
          <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
            Studying in 25-minute bursts helps prevent burnout and keeps your brain fresh for those complex SNHU modules.
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
          <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-2">Take a Real Break</h4>
          <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
            During your 5-minute break, step away from the screen. Stretch, grab water, or look out a window.
          </p>
        </div>
      </div>
    </div>
  );
}
