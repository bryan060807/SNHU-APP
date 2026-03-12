import React, { useState } from 'react';
import { Course } from '../types';
import { Plus, Trash2, BookOpen, Palette, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SyllabusImporter } from './SyllabusImporter';
import { SyllabusData, Assignment } from '../types';

interface CourseListProps {
  courses: Course[];
  addCourse: (c: Omit<Course, 'id'>) => Promise<void>;
  deleteCourse: (id: string) => void;
  bulkAddAssignments: (assignments: Omit<Assignment, 'id'>[]) => Promise<void>;
}

const COLORS = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Emerald', value: 'bg-emerald-500' },
  { name: 'Rose', value: 'bg-rose-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Violet', value: 'bg-violet-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
];

export function CourseList({ courses, addCourse, deleteCourse, bulkAddAssignments }: CourseListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<SyllabusData | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0].value);
  const [newTermStart, setNewTermStart] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    await addCourse({
      code: newCode,
      name: newName,
      color: newColor,
      termStartDate: newTermStart || undefined,
    });
    setNewCode('');
    setNewName('');
    setNewTermStart('');
    setIsAdding(false);
  };

  const handleImport = (data: SyllabusData) => {
    setImportData(data);
    setNewCode(data.courseCode);
    setNewName(data.courseName);
    setNewTermStart(data.termStartDate);
    setIsImporting(false);
    setIsAdding(true);
  };

  const handleConfirmImport = async () => {
    if (!newCode || !newName || !importData) return;
    
    const courseId = Math.random().toString(36).substr(2, 9);
    await addCourse({
      id: courseId,
      code: newCode,
      name: newName,
      color: newColor,
      termStartDate: newTermStart || undefined,
    } as any);

    const assignmentsToImport = importData.assignments.map(a => ({
      ...a,
      courseId,
      status: 'todo' as const
    }));

    await bulkAddAssignments(assignmentsToImport);
    
    setImportData(null);
    setIsAdding(false);
    setNewCode('');
    setNewName('');
    setNewTermStart('');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Your Courses</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your active SNHU courses.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImporting(true)}
            className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <FileText size={20} className="text-blue-500" /> Import Syllabus
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#003057] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/10"
          >
            <Plus size={20} /> Add Course
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isImporting && (
          <SyllabusImporter 
            onImport={handleImport} 
            onClose={() => setIsImporting(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={importData ? (e) => { e.preventDefault(); handleConfirmImport(); } : handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-blue-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-4 mb-6">
              {importData && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-4">
                  <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                    <FileText size={16} /> Review Imported Data
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    We found {importData.assignments.length} assignments in your syllabus. Review the course details below and click "Confirm & Add" to save everything.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Course Code</label>
                  <input 
                    autoFocus
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white"
                    placeholder="e.g. IT-140"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Course Name</label>
                  <input 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white"
                    placeholder="e.g. Introduction to Scripting"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Term Start Date (Monday)</label>
                  <input 
                    type="date"
                    value={newTermStart}
                    onChange={(e) => setNewTermStart(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">Used to calculate SNHU module due dates.</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Theme Color</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewColor(color.value)}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all ring-offset-2",
                        color.value,
                        newColor === color.value ? "ring-2 ring-slate-400 dark:ring-slate-600 scale-110" : "hover:scale-105"
                      )}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setIsAdding(false); setImportData(null); }} className="px-6 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
                <button type="submit" className="bg-[#003057] text-white px-8 py-2 rounded-xl font-bold hover:bg-blue-900 transition-all">
                  {importData ? 'Confirm & Add' : 'Save Course'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {courses.map((course) => (
          <motion.div 
            key={course.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 relative group hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50 transition-all"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg", course.color)}>
              <BookOpen size={24} />
            </div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{course.code}</h3>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-4">{course.name}</h4>
            
            {course.termStartDate && (
              <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <Clock size={12} />
                Term Starts: {format(new Date(course.termStartDate), 'MMM d, yyyy')}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Course</span>
              <button 
                onClick={() => deleteCourse(course.id)}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
        {courses.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
            <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No courses added yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">Add your current SNHU courses to start tracking assignments and study time.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="mt-6 text-[#003057] dark:text-blue-400 font-bold hover:underline"
            >
              Add your first course
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
