/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Course, Assignment, SyllabusData, View } from '../types';
import { Plus, Trash2, BookOpen, Clock, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SyllabusImporter } from './SyllabusImporter';
import { useToast } from './Toast';

interface CourseListProps {
  courses: Course[];
  addCourse: (c: Omit<Course, 'id'>) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    
    setIsLoading(true);
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
    setIsLoading(false);
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
    setIsLoading(true);
    
    try {
      // 1. Insert course and get the UUID from Supabase
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert([{
          code: newCode,
          name: newName,
          color: newColor,
          term_start_date: newTermStart || null,
        }])
        .select()
        .single();

      if (courseError) throw courseError;

      // 2. Map assignments to the new Course UUID
      const assignmentsToImport = importData.assignments.map(a => ({
        course_id: courseData.id,
        title: a.title,
        due_date: a.dueDate,
        type: a.type,
        status: 'todo',
        estimated_hours: a.estimatedHours
      }));

      // 3. Bulk insert assignments
      await bulkAddAssignments(assignmentsToImport);
      
      showToast('Success', `Imported ${newCode} with ${assignmentsToImport.length} tasks.`, 'success');
      setIsAdding(false);
    } catch (error: any) {
      showToast('Error', error.message || 'Failed to import syllabus.', 'error');
    } finally {
      setIsLoading(false);
      setImportData(null);
      setNewCode('');
      setNewName('');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Your Courses</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your active SNHU terms.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImporting(true)}
            className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <FileText size={20} className="text-blue-600" /> Import Syllabus
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <form 
              onSubmit={importData ? (e) => { e.preventDefault(); handleConfirmImport(); } : handleSubmit} 
              className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-blue-100 dark:border-slate-800 shadow-2xl shadow-blue-900/5 space-y-6 mb-8"
            >
              {importData && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/50">
                  <h3 className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={16} /> Syllabus Detected
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 font-medium">
                    Review the details and click "Confirm" to bulk-add {importData.assignments.length} assignments.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Code</label>
                  <input 
                    autoFocus
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                    placeholder="e.g. HIS-217"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Name</label>
                  <input 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                    placeholder="e.g. US History II"
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
                      "w-10 h-10 rounded-full transition-all ring-offset-4 dark:ring-offset-slate-900",
                      color.value,
                      newColor === color.value ? "ring-4 ring-blue-500 scale-110" : "hover:scale-105 opacity-80"
                    )}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setIsAdding(false); setImportData(null); }} className="px-6 py-2 font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : (importData ? 'Confirm & Add' : 'Save Course')}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <motion.div 
            key={course.id}
            layout
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 relative group hover:shadow-2xl hover:shadow-blue-900/5 transition-all"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl", course.color)}>
              <BookOpen size={28} />
            </div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{course.code}</h3>
            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-6">{course.name}</h4>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SNHU 2026 Term</span>
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