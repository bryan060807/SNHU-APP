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
  Zap, 
  Sparkles,
  BookOpen,
  Layout
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
  const { profile } = useAuth();

  // Personalization Logic
  const today = new Date();
  const isBirthMonth = profile?.birthday ? 
    (today.getMonth() + 1 === Number(profile.birthday.split('-')[1])) : false;

  // Filter Logic
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

  // Stats Calculation
  const totalHours = incomplete.reduce((acc, curr) => acc + curr.estimatedHours, 0);
  const progressPercent = assignments.length > 0 
    ? Math.round((assignments.filter(a => a.status === 'completed').length / assignments.length) * 100) 
    : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Personalization */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Scholar'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {completedToday > 0 
              ? `You've crushed ${completedToday} tasks today. Keep the momentum!` 
              : "Let's tackle this week's SNHU modules."}
          </p>
        </div>
        
        {isBirthMonth && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 rounded-2xl text-white shadow-lg shadow-blue-500/20 flex items-center gap-3"
          >
            <div className="bg-white/20 p-2 rounded-xl">
              <Sparkles size={20} className="text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest">Birthday Month</h4>
              <p className="text-[10px] opacity-90">Special milestone active for you!</p>
            </div>
          </motion.div>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          label="Academic Momentum" 
          value={`${progressPercent}%`} 
          subValue="Completion Rate"
          icon={<Zap size={20} />}
          color="bg-blue-600"
        />
        <StatCard 
          label="Time Commitment" 
          value={`${totalHours}h`} 
          subValue="Remaining This Week"
          icon={<Clock size={20} />}
          color="bg-indigo-600"
        />
        <StatCard 
          label="Courses" 
          value={courses.length.toString()} 
          subValue="Active Terms"
          icon={<BookOpen size={20} />}
          color="bg-emerald-600"
        />
        <StatCard 
          label="Overdue" 
          value={overdue.length.toString()} 
          subValue="Action Required"
          icon={<AlertCircle size={20} />}
          color={overdue.length > 0 ? "bg-rose-600" : "bg-slate-400"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed: Upcoming Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <Calendar size={22} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Deadlines</h3>
              </div>
              <button 
                onClick={() => setView('assignments')}
                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {upcoming.length > 0 ? (
                upcoming.map((a) => {
                  const course = courses.find(c => c.id === a.courseId);
                  const isDueSoon = isBefore(new Date(a.dueDate), addDays(today, 2));
                  
                  return (
                    <div key={a.id} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => updateStatus(a.id, 'completed')}
                          className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-transparent hover:border-blue-500 hover:text-blue-500 transition-all"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{a.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded", course?.color || 'bg-slate-500', 'text-white')}>
                              {course?.code}
                            </span>
                            <span className={cn(
                              "text-xs font-medium flex items-center gap-1",
                              isDueSoon ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
                            )}>
                              <Clock size={12} />
                              {format(new Date(a.dueDate), 'MMM d, p')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{a.type}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-slate-400 dark:text-slate-600">
                  <Layout size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No immediate deadlines. Time for a break?</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: Course Progress */}
        <div className="space-y-6">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Course Focus</h3>
            <div className="space-y-6">
              {courses.map(course => {
                const courseAssignments = assignments.filter(a => a.courseId === course.id);
                const courseCompleted = courseAssignments.filter(a => a.status === 'completed').length;
                const coursePercent = courseAssignments.length > 0 
                  ? Math.round((courseCompleted / courseAssignments.length) * 100) 
                  : 0;

                return (
                  <div key={course.id} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-slate-400">{course.code}</span>
                      <span className="text-slate-900 dark:text-white">{coursePercent}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${coursePercent}%` }}
                        className={cn("h-full", course.color.replace('text-', 'bg-'))}
                      />
                    </div>
                  </div>
                );
              })}
              {courses.length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-4">Add courses to track progress.</p>
              )}
            </div>
          </section>

          {/* SNHU Quick Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Zap size={14} /> SNHU Pro-Tip
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
              Initial discussion posts are due Thursdays by 11:59 PM. Set your timer for 45 minutes tonight to beat the rush.
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
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4", color)}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</h3>
      <p className="text-[10px] font-bold text-slate-500 mt-1">{subValue}</p>
    </motion.div>
  );
}