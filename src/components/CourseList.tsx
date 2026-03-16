/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Course, SyllabusData } from '../types';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  FileText, 
  Loader2, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SyllabusImporter } from './SyllabusImporter';
import { useToast } from './Toast';

interface CourseListProps {
  courses: Course[];
  addCourse: (c: Omit<Course, 'id'>) => Promise<any>;
  deleteCourse: (id: string) => void;
  bulkAddAssignments: (assignments: any[]) => Promise<void>;
}

const COLORS = [
  { name: 'Blue', value: 'bg-blue-600' },
  { name: 'Amber', value: 'bg-amber-600' },
  { name: 'Emerald', value: 'bg-emerald-600' },
  { name: 'Rose', value: 'bg-rose-600' },
  { name: 'Indigo', value: 'bg-indigo-600' },
  { name: 'Violet', value: 'bg-violet-600' },
  { name: 'Orange', value: 'bg-orange-600' },
  { name: 'Cyan', value: 'bg-cyan-600' },
];

export function CourseList({ courses, addCourse, deleteCourse, bulkAddAssignments }: CourseListProps) {
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [importData, setImportData] = useState<SyllabusData | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0].value);
  const [newTermStart, setNewTermStart] = useState('');

  const resetForm = () => {
    setNewCode('');
    setNewName('');
    setNewTermStart('');
    setImportData(null);
    setIsAdding(false);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    
    setIsLoading(true);
    try {
      await addCourse({
        code: newCode,
        name: newName,
        color: newColor,
        termStartDate: newTermStart || undefined,
      });
      showToast('Success', `${newCode} added to mainframe.`, 'success');
      resetForm();
    } catch (error: any) {
      showToast('Error', 'Failed to save course.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = (data: SyllabusData) => {
    setImportData(data);
    setNewCode(data.courseCode);
    setNewName(data.courseName);
    setNewTermStart(data.termStartDate);
    setIsImporting(false);
    setIsAdding(true);
  };

  /**
   * 7-3-1 Engagement Protocol Implementation
   * Snaps extracted assignments to SNHU Industrial Grid
   */
  const handleConfirmImport = async () => {
    if (!newCode || !newName || !importData || !newTermStart) {
      showToast('Data Missing', 'Please ensure Term Start Date is set for 7-3-1 sync.', 'error');
      return;
    }
    setIsLoading(true);
    
    try {
      const courseData = await addCourse({
        code: newCode,
        name: newName,
        color: newColor,
        termStartDate: newTermStart,
      });

      if (!courseData?.id) throw new Error("Course initialization failed.");

      // Normalize termStart to midnight for clean arithmetic
      const termStart = new Date(newTermStart);
      termStart.setHours(0, 0, 0, 0);

      const assignmentsToImport = importData.assignments.map(a => {
        const extractedDate = new Date(a.dueDate);
        
        // Calculate Module Week (1-8)
        // Using Math.floor(days / 7) + 1 ensures Days 0-6 land in Module 1
        const timeDiff = extractedDate.getTime() - termStart.getTime();
        const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const weekNumber = Math.max(1, Math.min(8, Math.floor(diffDays / 7) + 1));

        // Recalibrate to SNHU Thursday/Sunday snap
        const finalDate = new Date(termStart);
        const weekOffset = (weekNumber - 1) * 7;
        
        // Snap: Day 3 (Thu) for Discussions, Day 6 (Sun) for others
        const dayOffset = a.type === 'discussion' ? 3 : 6; 
        
        finalDate.setDate(termStart.getDate() + weekOffset + dayOffset);
        finalDate.setHours(23, 59, 0, 0);

        // Standardize Labeling (Fixes inconsistency between courses)
        const displayTitle = a.title.toLowerCase().includes('mod') 
          ? a.title 
          : `Module ${weekNumber}: ${a.title}`;

        return {
          course_id: courseData.id,
          title: displayTitle,
          due_date: finalDate.toISOString(),
          type: a.type,
          status: 'todo',
          estimated_hours: a.estimatedHours || (a.type === 'discussion' ? 2 : 4)
        };
      });

      await bulkAddAssignments(assignmentsToImport);
      
      showToast('Sync Complete', `7-3-1 Protocol active. ${assignmentsToImport.length} tasks snapped to grid.`, 'success');
      resetForm();
    } catch (error: any) {
      console.error("Import Crash:", error);
      showToast('Mainframe Error', error.message || 'Failed to import syllabus.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Your Courses</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage active SNHU terms</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImporting(true)}
            className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-all shadow-xl"
          >
            <FileText size={18} className="text-blue-600" /> Import Syllabus
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
          >
            <Plus size={18} /> Add Course
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <form 
              onSubmit={importData ? (e) => { e.preventDefault(); handleConfirmImport(); } : handleSubmit} 
              className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-blue-500 dark:border-slate-800 shadow-2xl space-y-6 mb-8"
            >
              {importData && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/50">
                  <h3 className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={16} /> Syllabus Analysis Complete
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 font-medium italic">
                    Applying 7-3-1 Protocol: Snapping {importData.assignments.length} assignments to industrial grid.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Label (Code)</label>
                  <input 
                    autoFocus
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-bold outline-none focus:border-blue-500 transition-all"
                    placeholder="e.g. HIS-217"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Module Title (Name)</label>
                  <input 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-bold outline-none focus:border-blue-500 transition-all"
                    placeholder="e.g. US History II"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Baseline (Term Start Date)</label>
                  <input 
                    type="date"
                    value={newTermStart}
                    onChange={(e) => setNewTermStart(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:text-white font-bold outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewColor(color.value)}
                    className={cn(
                      "w-10 h-10 rounded-xl transition-all shadow-lg",
                      color.value,
                      newColor === color.value ? "ring-4 ring-blue-500 scale-110" : "hover:scale-105 opacity-60"
                    )}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                <button type="button" onClick={resetForm} className="px-6 py-2 font-black uppercase text-xs text-slate-400 hover:text-slate-800 transition-colors tracking-widest">Abort</button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-xl shadow-blue-600/20"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : (importData ? 'Confirm Extraction' : 'Initialize Course')}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <motion.div 
            key={course.id}
            layout
            className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 p-8 relative group hover:shadow-2xl transition-all"
          >
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl", course.color)}>
              <BookOpen size={32} />
            </div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic">{course.code}</h3>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-8 tracking-tighter">{course.name}</h4>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SNHU Term 2026</span>
              <button 
                onClick={() => deleteCourse(course.id)}
                className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}