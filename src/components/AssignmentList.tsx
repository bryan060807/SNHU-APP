/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Course, Assignment } from '../types';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Filter, 
  Search, 
  Edit2, 
  Brain, 
  Activity, // Swapped Zap for Activity
  PlayCircle, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  X 
} from 'lucide-react';
import { format, addDays, startOfWeek, setHours, setMinutes, isBefore } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { improveAssignmentTitle } from '../services/geminiService';

interface AssignmentListProps {
  courses: Course[];
  assignments: Assignment[];
  addAssignment: (a: Omit<Assignment, 'id'>) => void;
  updateAssignment: (a: Assignment) => void;
  updateStatus: (id: string, status: Assignment['status']) => void;
  deleteAssignment: (id: string) => void;
}

const QUICK_PICKS = [
  { id: 'discussion-initial', label: 'Discussion Initial Post', type: 'discussion' as const, day: 'Thursday', hours: 2 },
  { id: 'discussion-responses', label: 'Discussion Responses', type: 'discussion' as const, day: 'Sunday', hours: 1 },
  { id: 'module-assignment', label: 'Module Assignment', type: 'assignment' as const, day: 'Sunday', hours: 4 },
  { id: 'module-quiz', label: 'Module Quiz', type: 'quiz' as const, day: 'Sunday', hours: 1 },
  { id: 'final-project', label: 'Final Project / Milestone', type: 'project' as const, day: 'Sunday', hours: 6 },
];

export function AssignmentList({ courses, assignments, addAssignment, updateAssignment, updateStatus, deleteAssignment }: AssignmentListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState<Assignment['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'course' | 'type'>('date');
  const [search, setSearch] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState(courses[0]?.id || '');
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [newType, setNewType] = useState<Assignment['type']>('assignment');
  const [newHours, setNewHours] = useState<number>(3);
  const [selectedModule, setSelectedModule] = useState<number>(1);

  useEffect(() => {
    if (courses.length > 0 && !newCourse) {
      setNewCourse(courses[0].id);
    }
  }, [courses, newCourse]);

  const handleImproveTitle = async () => {
    if (!newTitle) return;
    setIsImproving(true);
    const improved = await improveAssignmentTitle(newTitle);
    setNewTitle(improved);
    setIsImproving(false);
  };

  const handleQuickPick = (pickId: string) => {
    const pick = QUICK_PICKS.find(p => p.id === pickId);
    if (!pick) return;

    const course = courses.find(c => c.id === newCourse);
    let dueDate = new Date();

    if (course?.termStartDate) {
      const termStart = new Date(course.termStartDate);
      const weekOffset = (selectedModule - 1) * 7;
      const dayOffset = pick.day === 'Thursday' ? 3 : 6; 
      dueDate = addDays(termStart, weekOffset + dayOffset);
    } else {
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const dayOffset = pick.day === 'Thursday' ? 3 : 6;
      dueDate = addDays(startOfCurrentWeek, dayOffset);
    }

    dueDate = setHours(setMinutes(dueDate, 59), 23);

    setNewTitle(`Module ${selectedModule}: ${pick.label}`);
    setNewType(pick.type);
    setNewHours(pick.hours);
    setNewDate(format(dueDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const payload = {
      title: newTitle,
      courseId: newCourse,
      dueDate: new Date(newDate).toISOString(),
      type: newType,
      estimatedHours: newHours,
    };

    if (editingAssignment) {
      updateAssignment({ ...editingAssignment, ...payload });
    } else {
      addAssignment({ ...payload, status: 'todo' });
    }
    
    cancelForm();
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingAssignment(null);
    setNewTitle('');
    setNewCourse(courses[0]?.id || '');
    setNewDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setNewType('assignment');
    setNewHours(3);
  };

  const filteredAssignments = assignments
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
    });

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Assignments</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Synchronizing your SNHU workload.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingAssignment(null); }}
          className="bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <Plus size={24} /> <span>NEW TASK</span>
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] focus:border-blue-500 outline-none transition-all dark:text-white font-bold"
          />
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800">
          {(['all', 'todo', 'in-progress', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-6 py-2 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all",
                filter === s ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-md" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-blue-100 dark:border-slate-800 shadow-2xl space-y-8"
          >
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                 {editingAssignment ? 'Edit Deployment' : 'New Assignment Deployment'}
               </h3>
               <button onClick={cancelForm} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                 <X size={28} />
               </button>
            </div>

            {!editingAssignment && (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 space-y-4">
                 <div className="flex items-center gap-3">
                   <Activity size={20} className="text-blue-600" />
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SNHU Quick-Pick Modules</span>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {[1,2,3,4,5,6,7,8].map(m => (
                      <button 
                        key={m}
                        type="button"
                        onClick={() => setSelectedModule(m)}
                        className={cn(
                          "py-2 rounded-xl text-[10px] font-black transition-all border-2",
                          selectedModule === m ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400"
                        )}
                      >
                        MOD {m}
                      </button>
                    ))}
                 </div>
                 <div className="flex flex-wrap gap-2 pt-2">
                    {QUICK_PICKS.map(pick => (
                      <button
                        key={pick.id}
                        type="button"
                        onClick={() => handleQuickPick(pick.id)}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300 hover:border-blue-500 transition-all uppercase"
                      >
                        {pick.label}
                      </button>
                    ))}
                 </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-bold outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleImproveTitle}
                      disabled={isImproving || !newTitle}
                      className="px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl border-2 border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-all disabled:opacity-50"
                    >
                      {isImproving ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course</label>
                  <select 
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-bold outline-none"
                  >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deadline</label>
                  <input 
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignment Type</label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-bold outline-none"
                  >
                    <option value="discussion">Discussion</option>
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                    <option value="project">Project</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                  {editingAssignment ? 'Update Deployment' : 'Deploy Assignment'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}