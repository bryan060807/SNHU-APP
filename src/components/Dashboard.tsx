/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Course, Assignment, View } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  ArrowRight, 
  Activity, 
  Sparkles,
  BookOpen,
  Layout,
  TrendingUp
} from 'lucide-react';
import { format, isBefore, addDays } from 'date-fns';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  courses: Course[];
  assignments: Assignment[];
  updateStatus: (id: string, status: Assignment['status']) => Promise<void>;
  setView: (view: View) => void;
}

export function Dashboard({ courses, assignments, updateStatus, setView }: DashboardProps) {
  const { user } = useAuth();

  const today = new Date();
  const firstName = user?.full_name?.split(' ')[0] || 'Scholar';

  const incomplete = assignments.filter(a => a.status !== 'completed');
  const upcoming = incomplete
    .filter(a => !isBefore(new Date(a.dueDate), today))
    .slice(0, 3);
  
  const overdue = incomplete.filter(a => isBefore(new Date(a.dueDate), today));
  
  const completedToday = assignments.filter(a => 
    a.status === 'completed' && 
    a.completedAt && 
    new Date(a.completedAt).toDateString() === today.toDateString()
  ).length;

  const totalHoursRemaining = incomplete.reduce((acc, curr) => acc + (curr.estimatedHours || 0), 0);
  const progressPercent = assignments.length > 0 
    ? Math.round((assignments.filter(a => a.status === 'completed').length / assignments.length) * 100) 
    : 0;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
            Systems Online, {firstName}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {completedToday > 0 
              ? `Operational Excellence: ${completedToday} modules cleared today.` 
              : "Awaiting input. Select a module to begin extraction."}
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-blue-900/5 transition-all hover:border-blue-500">
          <TrendingUp size={20} className="text-blue-600" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Week 1 / 8</span>
        </div>
      </header>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Course Load" 
          value={`${progressPercent}%`} 
          subValue="Term Completion"
          icon={<Activity size={22} />}
          color="bg-blue-600 shadow-blue-600/30"
        />
        <StatCard 
          label="Time Debt" 
          value={`${totalHoursRemaining}h`} 
          subValue="Active Commitment"
          icon={<Clock size={22} />}
          color="bg-slate-900 dark:bg-blue-950 shadow-slate-900/30"
        />
        <StatCard 
          label="Active Sync" 
          value={courses.length.toString()} 
          subValue="Course Modules"
          icon={<BookOpen size={22} />}
          color="bg-emerald-600 shadow-emerald-600/30"
        />
        <StatCard 
          label="System Faults" 
          value={overdue.length.toString()} 
          subValue="Overdue Tasks"
          icon={<AlertCircle size={22} />}
          color={overdue.length > 0 ? "bg-rose-600 shadow-rose-600/40" : "bg-slate-400 shadow-slate-400/10"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Deadline Logic Module */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden transition-all hover:shadow-blue-900/10">
            <div className="p-8 md:p-10 border-b-2 border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Calendar size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Active Deadlines</h3>
              </div>
              <button 
                onClick={() => setView('assignments')}
                className="p-4 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 border-2 border-transparent hover:border-blue-600 transition-all active:scale-95 shadow-sm"
              >
                <ArrowRight size={20} />
              </button>
            </div>
            
            <div className="divide-y-2 divide-slate-50 dark:divide-slate-800">
              {upcoming.length > 0 ? (
                upcoming.map((a) => {
                  const course = courses.find(c => c.id === a.courseId);
                  const isDueSoon = isBefore(new Date(a.dueDate), addDays(today, 2));
                  
                  return (
                    <motion.div 
                      key={a.id} 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="p-8 flex items-center justify-between group hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all cursor-default"
                    >
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={() => updateStatus(a.id, 'completed')}
                          className="w-12 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-transparent hover:border-emerald-500 hover:text-emerald-500 transition-all group/check bg-white dark:bg-slate-900"
                        >
                          <CheckCircle2 size={24} className="group-hover/check:scale-110 transition-transform" />
                        </button>
                        <div>
                          <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase italic">{a.title}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-2 shadow-sm", 
                              course?.color || 'bg-slate-500 border-slate-500', 
                              'text-white'
                            )}>
                              {course?.code}
                            </span>
                            <span className={cn(
                              "text-[11px] font-bold flex items-center gap-1.5 uppercase tracking-tighter italic",
                              isDueSoon ? "text-rose-500 animate-pulse" : "text-slate-400"
                            )}>
                              <Clock size={14} />
                              {format(new Date(a.dueDate), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                         <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] italic">{a.type}</span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-24 text-center">
                  <Layout size={64} className="mx-auto mb-6 text-slate-200 dark:text-slate-800 opacity-50" />
                  <p className="font-black text-slate-400 uppercase tracking-widest italic text-sm">Mainframe Cleared: No Pending Extraction</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Saturation Module */}
          <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl hover:shadow-blue-900/10 transition-all">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-10 border-b-2 border-slate-50 dark:border-slate-800 pb-4">
              Course Saturation
            </h3>
            <div className="space-y-10">
              {courses.map(course => {
                const courseAssignments = assignments.filter(a => a.courseId === course.id);
                const courseCompleted = courseAssignments.filter(a => a.status === 'completed').length;
                const coursePercent = courseAssignments.length > 0 
                  ? Math.round((courseCompleted / courseAssignments.length) * 100) 
                  : 0;

                return (
                  <div key={course.id} className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                      <span className="text-slate-400 italic">{course.code}</span>
                      <span className="text-slate-900 dark:text-white italic">{coursePercent}%</span>
                    </div>
                    <div className="h-5 bg-slate-50 dark:bg-slate-800/50 rounded-full p-1 border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${coursePercent}%` }}
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(37,99,235,0.2)]", 
                          course.color.replace('text-', 'bg-')
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* System Advisory */}
          <div className="bg-slate-900 dark:bg-blue-950 p-8 rounded-[2.5rem] border-2 border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/20 transition-all" />
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles size={16} /> System Advisory
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-bold italic uppercase tracking-tighter relative z-10">
              Thursday initial posts are critical for peer response compliance. Complete Discussion posts by 21:00 to avoid late-term oxidation and neural drift.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon, color }: { label: string, value: string, subValue: string, icon: React.ReactNode, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10, scale: 1.02 }}
      className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 shadow-xl shadow-blue-900/5 flex flex-col items-center text-center transition-all hover:border-blue-500/50"
    >
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl", color)}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">{label}</p>
      <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">{value}</h3>
      <p className="text-[10px] font-bold text-slate-500 mt-3 uppercase tracking-widest border-t-2 border-slate-50 dark:border-slate-800 pt-3 w-full">{subValue}</p>
    </motion.div>
  );
}