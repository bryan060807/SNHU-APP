/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  FileText, 
  Loader2, 
  ExternalLink, 
  Database, 
  Zap, 
  Lock, 
  RefreshCcw 
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export function IntegrationsHub() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check connection based on Supabase provider metadata
  const isConnected = !!user?.email?.includes('@gmail.com');

  const fetchAllData = async () => {
    if (!isConnected) return;
    setIsLoading(true);
    
    try {
      // 1. Invoke the Edge Function for Calendar
      const { data: calData, error: calError } = await supabase.functions.invoke('google-calendar');
      if (calError) console.warn("Calendar Sync Failed:", calError);
      else setCalendarEvents(calData || []);

      // 2. Invoke placeholders for Tasks/Drive (assuming future edge functions)
      // const { data: taskData } = await supabase.functions.invoke('google-tasks');
      // const { data: driveData } = await supabase.functions.invoke('google-drive');
      
    } catch (error) {
      console.error('Integration Sync Error:', error);
      showToast('Sync Error', 'Biometric data link interrupted.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [isConnected]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Neural Link Hub</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">External Ecosystem Integration</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isConnected && (
            <button 
              onClick={fetchAllData}
              disabled={isLoading}
              className="p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-blue-500 transition-all shadow-xl active:scale-95"
            >
              <RefreshCcw size={20} className={cn(isLoading && "animate-spin")} />
            </button>
          )}
          <div className={cn(
            "flex items-center gap-3 px-6 py-3 rounded-[2rem] border-2 shadow-xl transition-all",
            isConnected ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800" : "bg-slate-100 border-slate-200 text-slate-500"
          )}>
            <Database size={18} className={isConnected ? "animate-pulse" : ""} />
            <span className="text-xs font-black uppercase tracking-widest">
              {isConnected ? "Google Cloud Active" : "Ecosystem Offline"}
            </span>
          </div>
        </div>
      </header>

      {!isConnected ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 text-center space-y-6 shadow-2xl"
        >
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto text-slate-400">
            <Lock size={40} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Authorization Required</h3>
            <p className="text-slate-500 mt-2 font-medium">Connect your SNHU-linked Google account in Settings to synchronize your biological rhythm.</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-6 hover:border-blue-500/50 transition-all flex flex-col">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Calendar size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Calendar</h3>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] min-h-[200px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : calendarEvents.length > 0 ? (
                calendarEvents.map((event) => (
                  <div key={event.id} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 group">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">
                      {event.start?.dateTime ? format(new Date(event.start.dateTime), 'MMM d, h:mm a') : 'All Day'}
                    </span>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate mt-1">{event.summary}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-30">
                   <Zap size={32} className="mb-2" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Neural Stream Empty</p>
                </div>
              )}
            </div>
            <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
              Launch Calendar <ExternalLink size={14} />
            </a>
          </section>

          {/* Tasks Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-6 hover:border-emerald-500/50 transition-all flex flex-col">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                <CheckSquare size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Tasks</h3>
            </div>

            <div className="space-y-3 flex-1 min-h-[200px]">
               <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-30">
                   <CheckSquare size={32} className="mb-2" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No Active Google Tasks</p>
                </div>
            </div>
            <a href="https://tasks.google.com/" target="_blank" rel="noreferrer" className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all">
              Launch Tasks <ExternalLink size={14} />
            </a>
          </section>

          {/* Drive Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl space-y-6 hover:border-purple-500/50 transition-all flex flex-col">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Drive</h3>
            </div>

            <div className="space-y-3 flex-1 min-h-[200px]">
               <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-30">
                   <FileText size={32} className="mb-2" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Ready for Extraction</p>
                </div>
            </div>
            <a href="https://drive.google.com/" target="_blank" rel="noreferrer" className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-purple-600 hover:text-white transition-all">
              Launch Drive <ExternalLink size={14} />
            </a>
          </section>
        </div>
      )}
    </div>
  );
}