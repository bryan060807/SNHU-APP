import React, { useState, useEffect } from 'react';
import { Course, Assignment } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Filter, Search, Edit2, Brain, Zap, PlayCircle, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { format, addDays, startOfWeek, setHours, setMinutes, isBefore } from 'date-fns';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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
  const [isImproving, setIsImproving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState<Assignment['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'course' | 'type'>('date');
  const [search, setSearch] = useState('');

  const improveTitle = async () => {
    if (!newTitle) return;
    setIsImproving(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Improve this assignment title to be more clear and professional: "${newTitle}"`,
      });
      if (response.text) {
        setNewTitle(response.text.replace(/^"|"$/g, ''));
      }
    } catch (error) {
      console.error('Failed to improve title:', error);
    } finally {
      setIsImproving(false);
    }
  };

  const getStatusConfig = (status: Assignment['status']) => {
    switch (status) {
      case 'completed':
        return { 
          label: 'Completed', 
          color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30',
          icon: CheckCircle2
        };
      case 'in-progress':
        return { 
          label: 'In Progress', 
          color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30',
          icon: PlayCircle
        };
      default:
        return { 
          label: 'To Do', 
          color: 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700',
          icon: Circle
        };
    }
  };

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

  const handleQuickPick = (pickId: string) => {
    const pick = QUICK_PICKS.find(p => p.id === pickId);
    if (!pick) return;

    const course = courses.find(c => c.id === newCourse);
    let dueDate = new Date();

    if (course?.termStartDate) {
      // Calculate based on term start date (assuming it's a Monday)
      const termStart = new Date(course.termStartDate);
      const weekOffset = (selectedModule - 1) * 7;
      const dayOffset = pick.day === 'Thursday' ? 3 : 6; // Thursday is 3 days after Monday, Sunday is 6
      dueDate = addDays(termStart, weekOffset + dayOffset);
    } else {
      // Fallback: Current week's Thursday/Sunday
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
      const dayOffset = pick.day === 'Thursday' ? 3 : 6;
      dueDate = addDays(startOfCurrentWeek, dayOffset);
    }

    // Set to 11:59 PM
    dueDate = setHours(setMinutes(dueDate, 59), 23);

    setNewTitle(`Module ${selectedModule}: ${pick.label}`);
    setNewType(pick.type);
    setNewHours(pick.hours);
    setNewDate(format(dueDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const filteredAssignments = assignments
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'course') {
        const courseA = courses.find(c => c.id === a.courseId)?.code || '';
        const courseB = courses.find(c => c.id === b.courseId)?.code || '';
        return courseA.localeCompare(courseB);
      }
      if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    if (editingAssignment) {
      updateAssignment({
        ...editingAssignment,
        title: newTitle,
        courseId: newCourse,
        dueDate: new Date(newDate).toISOString(),
        type: newType,
        estimatedHours: newHours,
      });
      setEditingAssignment(null);
    } else {
      addAssignment({
        title: newTitle,
        courseId: newCourse,
        dueDate: new Date(newDate).toISOString(),
        type: newType,
        status: 'todo',
        estimatedHours: newHours
      });
    }
    
    setNewTitle('');
    setIsAdding(false);
  };

  const startEditing = (a: Assignment) => {
    setEditingAssignment(a);
    setNewTitle(a.title);
    setNewCourse(a.courseId);
    setNewDate(format(new Date(a.dueDate), "yyyy-MM-dd'T'HH:mm"));
    setNewType(a.type);
    setNewHours(a.estimatedHours);
    setIsAdding(true);
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Assignments</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your coursework and deadlines.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingAssignment(null); }}
          className="bg-[#003057] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/10"
        >
          <Plus size={20} /> Add Assignment
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search assignments..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
          />
        </div>
        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
          {(['all', 'todo', 'in-progress', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize",
                filter === s ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-1">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="date">Sort by Date</option>
            <option value="course">Sort by Course</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">{editingAssignment ? 'Edit Assignment' : 'Add New Assignment'}</h3>
                {!editingAssignment && (
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <Zap size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">SNHU Quick Fill</span>
                  </div>
                )}
              </div>

              {!editingAssignment && (
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Module</label>
                      <select 
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(m => <option key={m} value={m}>Module {m}</option>)}
                      </select>
                    </div>
                    <div className="flex-[3] space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quick Pick Assignment Type</label>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_PICKS.map(pick => (
                          <button
                            key={pick.id}
                            type="button"
                            onClick={() => handleQuickPick(pick.id)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
                          >
                            {pick.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assignment Title</label>
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white"
                          placeholder="e.g. Discussion 1-1 Initial Post"
                        />
                        <button
                          type="button"
                          onClick={improveTitle}
                          disabled={isImproving || !newTitle}
                          className="px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all disabled:opacity-50"
                          title="Improve with AI"
                        >
                          {isImproving ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                        </button>
                      </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Course</label>
                    <select 
                      value={newCourse}
                      onChange={(e) => setNewCourse(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white"
                    >
                      {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Due Date</label>
                    <input 
                      type="datetime-local"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</label>
                    <select 
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white"
                    >
                      <option value="discussion">Discussion</option>
                      <option value="assignment">Assignment</option>
                      <option value="quiz">Quiz</option>
                      <option value="project">Project</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Est. Hours</label>
                    <input 
                      type="number"
                      step="0.5"
                      min="0"
                      value={newHours}
                      onChange={(e) => setNewHours(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={cancelForm} className="px-6 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
                  <button type="submit" className="bg-[#003057] text-white px-8 py-2 rounded-xl font-bold hover:bg-blue-900 transition-all">
                    {editingAssignment ? 'Update Assignment' : 'Save Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assignment</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Course</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Est. Hours</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Due Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredAssignments.map((a) => {
                const course = courses.find(c => c.id === a.courseId);
                const status = getStatusConfig(a.status);
                const StatusIcon = status.icon;
                const isOverdue = a.status !== 'completed' && isBefore(new Date(a.dueDate), new Date());
                const isDueSoon = a.status !== 'completed' && !isOverdue && isBefore(new Date(a.dueDate), addDays(new Date(), 1));

                return (
                  <motion.tr 
                    key={a.id} 
                    layout
                    className={cn(
                      "group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
                      a.status === 'in-progress' && "bg-blue-50/30 dark:bg-blue-900/5",
                      isDueSoon && "bg-amber-50/30 dark:bg-amber-900/5"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateStatus(a.id, a.status === 'completed' ? 'todo' : 'completed')}
                          className={cn(
                            "transition-colors",
                            a.status === 'completed' ? "text-emerald-500" : "text-slate-300 dark:text-slate-700 hover:text-slate-400 dark:hover:text-slate-500"
                          )}
                        >
                          {a.status === 'completed' ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                        </button>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border",
                          status.color
                        )}>
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className={cn("font-semibold text-slate-900 dark:text-white", a.status === 'completed' && "line-through text-slate-400 dark:text-slate-600")}>{a.title}</p>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{a.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", course?.color)} />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{course?.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                        <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                        {a.estimatedHours}h
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Clock size={14} />
                        {format(new Date(a.dueDate), 'MMM d, h:mm a')}
                        {isOverdue && <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-0.5 ml-2"><AlertCircle size={10} /> Overdue</span>}
                        {isDueSoon && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-0.5 ml-2"><AlertCircle size={10} /> Soon</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {a.status !== 'completed' && (
                          <button 
                            onClick={() => updateStatus(a.id, a.status === 'in-progress' ? 'todo' : 'in-progress')}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              a.status === 'in-progress' 
                                ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" 
                                : "text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            )}
                            title={a.status === 'in-progress' ? "Stop Working" : "Start Working"}
                          >
                            <PlayCircle size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => startEditing(a)}
                          className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteAssignment(a.id)}
                          className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600">
                    No assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredAssignments.map((a) => {
            const course = courses.find(c => c.id === a.courseId);
            const status = getStatusConfig(a.status);
            const isOverdue = a.status !== 'completed' && isBefore(new Date(a.dueDate), new Date());
            const isDueSoon = a.status !== 'completed' && !isOverdue && isBefore(new Date(a.dueDate), addDays(new Date(), 1));
            return (
              <div 
                key={a.id} 
                className={cn(
                  "p-4 space-y-3 transition-colors",
                  a.status === 'in-progress' && "bg-blue-50/30 dark:bg-blue-900/5",
                  isDueSoon && "bg-amber-50/30 dark:bg-amber-900/5"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-2">
                      <button 
                        onClick={() => updateStatus(a.id, a.status === 'completed' ? 'todo' : 'completed')}
                        className={cn(
                          "mt-1 transition-colors",
                          a.status === 'completed' ? "text-emerald-500" : "text-slate-300 dark:text-slate-700"
                        )}
                      >
                        {a.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>
                      {a.status !== 'completed' && (
                        <button 
                          onClick={() => updateStatus(a.id, a.status === 'in-progress' ? 'todo' : 'in-progress')}
                          className={cn(
                            "transition-colors",
                            a.status === 'in-progress' ? "text-blue-500" : "text-slate-300 dark:text-slate-700"
                          )}
                        >
                          <PlayCircle size={20} />
                        </button>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border",
                          status.color
                        )}>
                          {status.label}
                        </span>
                      </div>
                      <p className={cn("font-bold text-slate-900 dark:text-white leading-tight", a.status === 'completed' && "line-through text-slate-400 dark:text-slate-600")}>
                        {a.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{a.type}</span>
                        <div className="flex items-center gap-1.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", course?.color)} />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{course?.code}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditing(a)} className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => deleteAssignment(a.id)} className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    Due {format(new Date(a.dueDate), 'MMM d, h:mm a')}
                    {isOverdue && <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-0.5 ml-1"><AlertCircle size={10} /> Overdue</span>}
                    {isDueSoon && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-0.5 ml-1"><AlertCircle size={10} /> Soon</span>}
                  </div>
                  <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-4">
                    <Brain size={14} className="text-slate-400 dark:text-slate-500" />
                    {a.estimatedHours}h
                  </div>
                </div>
              </div>
            );
          })}
          {filteredAssignments.length === 0 && (
            <div className="p-12 text-center text-slate-400 dark:text-slate-600 text-sm">
              No assignments found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
