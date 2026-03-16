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
  Activity, // Swapped Zap for Activity
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
    <div className="space-y-10 pb-20">
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
        
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-blue-900/5">
          <TrendingUp size={20} className="text-blue-600" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Week 1 / 8</span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Course Load" 
          value={`${progressPercent}%`} 
          subValue="Term Completion"
          icon={<Activity size={22} />} // Swapped from Zap
          color="bg-blue-600 shadow-blue-600/20"
        />
        <StatCard 
          label="Time Debt" 
          value={`${totalHoursRemaining}h`} 
          subValue="7-3-1 Engagement"
          icon={<Clock size={22} />}
          color="bg-slate-900 dark:bg-blue-950 shadow-slate-900/20"
        />
        <StatCard 
          label="Active Sync" 
          value={courses.length.toString()} 
          subValue="Course Modules"
          icon={<BookOpen size={22} />}
          color="bg-emerald-600 shadow-emerald-600/20"
        />
        <StatCard 
          label="Failures" 
          value={overdue.length.toString()} 
          subValue="Overdue Tasks"
          icon={<AlertCircle size={22} />}
          color={overdue.length > 0 ? "bg-rose-600 shadow-rose-600/20" : "bg-slate-400 shadow-slate-400/10"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-blue-900/5 overflow-hidden">
            <div className="p-8 md:p-10 border-b-2 border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border-2 border-blue-100 dark:border-blue-800">
                  <Calendar size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Active Deadlines</h3>
              </div>
              <button 
                onClick={() => setView('assignments')}
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all"
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
                    <div key={a.id} className="p-8 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all">
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={() => updateStatus(a.id, 'completed')}
                          className="w-10 h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-transparent hover:border-emerald-500 hover:text-emerald-500 transition-all"
                        >
                          <CheckCircle2 size={24} />
                        </button>
                        <div>
                          <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{a.title}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-2", course?.color || 'bg-slate-500 border-slate-500', 'text-white')}>
                              {course?.code}
                            </span>
                            <span className={cn(
                              "text-[11px] font-bold flex items-center gap-1.5 uppercase tracking-tighter",
                              isDueSoon ? "text-rose-500" : "text-slate-400"
                            )}>
                              <Clock size={14} />
                              {format(new Date(a.dueDate), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                         <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">{a.type}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-20 text-center">
                  <Layout size={64} className="mx-auto mb-6 text-slate-200 dark:text-slate-800" />
                  <p className="font-black text-slate-400 uppercase tracking-widest italic">All Modules Cleared</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-blue-900/5">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-8">Course Saturation</h3>
            <div className="space-y-8">
              {courses.map(course => {
                const courseAssignments = assignments.filter(a => a.courseId === course.id);
                const courseCompleted = courseAssignments.filter(a => a.status === 'completed').length;
                const coursePercent = courseAssignments.length > 0 
                  ? Math.round((courseCompleted / courseAssignments.length) * 100) 
                  : 0;

                return (
                  <div key={course.id} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.1em]">
                      <span className="text-slate-400">{course.code}</span>
                      <span className="text-slate-900 dark:text-white">{coursePercent}%</span>
                    </div>
                    <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded-full p-1 border border-slate-100 dark:border-slate-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${coursePercent}%` }}
                        className={cn("h-full rounded-full transition-all duration-1000", course.color.replace('text-', 'bg-'))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="bg-slate-900 dark:bg-blue-950 p-8 rounded-[2.5rem] border-2 border-slate-800 shadow-2xl">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles size={16} /> System Advisory
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-bold italic uppercase tracking-tighter">
              Thursday initial posts are critical for peer response compliance. Complete Discussion posts by 21:00 to avoid late-term oxidation.
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
      whileHover={{ y: -8 }}
      className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 shadow-xl shadow-blue-900/5 flex flex-col items-center text-center"
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg", color)}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">{value}</h3>
      <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">{subValue}</p>
    </motion.div>
  );
}