/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AssignmentList } from './components/AssignmentList';
import { CourseList } from './components/CourseList';
import { StudyTimer } from './components/StudyTimer';
import { AIChat } from './components/AIChat';
import { Wellness } from './components/Wellness';
import { Settings } from './components/Settings';
import { AuthView } from './components/Auth/AuthView';
import { Course, Assignment, View } from './types';
import { useToast } from './components/Toast';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  /**
   * THEME PERSISTENCE
   * Bridges the Supabase profile theme with the DOM.
   */
  useEffect(() => {
    if (profile?.theme) {
      localStorage.setItem('theme', profile.theme);
      document.documentElement.classList.toggle('dark', profile.theme === 'dark');
    }
  }, [profile?.theme]);

  /**
   * CELEBRATION PROTOCOL
   * Triggers industrial-blue confetti on user's birthday.
   */
  useEffect(() => {
    if (profile?.birthday) {
      const parts = profile.birthday.split('-');
      if (parts.length === 3) {
        const birthMonth = parseInt(parts[1], 10);
        const birthDay = parseInt(parts[2], 10);
        const today = new Date();
        
        if ((today.getMonth() + 1) === birthMonth && today.getDate() === birthDay) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2563eb', '#1d4ed8', '#ffffff'] 
          });
          showToast(`Happy Birthday!`, "Initialization complete. Time to dominate the term.", 'success');
        }
      }
    }
  }, [profile, showToast]);

  /**
   * DATA STREAM: FETCH
   * Centralized retrieval for courses and assignments.
   */
  const fetchData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [coursesRes, assignmentsRes] = await Promise.all([
        supabase.from('courses').select('*'),
        supabase.from('assignments').select('*').order('due_date', { ascending: true })
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      setCourses(coursesRes.data || []);
      
      if (assignmentsRes.data) {
        setAssignments(assignmentsRes.data.map((a: any) => ({
          id: a.id,
          courseId: a.course_id,
          title: a.title || 'Untitled Assignment',
          dueDate: a.due_date || new Date().toISOString(),
          type: a.type || 'assignment',
          status: a.status || 'todo',
          estimatedHours: a.estimated_hours || 0,
          completedAt: a.completed_at
        })));
      }
    } catch (error: any) {
      console.error('Database Sync Error:', error.message);
      showToast('Sync Error', 'Academic data stream interrupted.', 'error');
    } finally {
      setDataLoading(false);
    }
  }, [user, showToast]);

  /**
   * REAL-TIME SUBSCRIPTION
   * Listens for Postgres changes to keep the Neural Link live.
   */
  useEffect(() => {
    fetchData();
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  /**
   * DATABASE MUTATIONS (Centralized)
   */
  const addCourse = async (course: Omit<Course, 'id'>) => {
    const { data, error } = await supabase
      .from('courses')
      .insert([{
        code: course.code,
        name: course.name,
        color: course.color,
        term_start_date: course.termStartDate || null
      }])
      .select()
      .single();

    if (error) {
      showToast('Error', 'Course creation failed.', 'error');
      throw error;
    }
    
    fetchData();
    return data; 
  };

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) showToast('Error', 'Deletion failed.', 'error');
    else fetchData();
  };

  const addAssignment = async (assignment: Omit<Assignment, 'id'>) => {
    const { error } = await supabase
      .from('assignments')
      .insert([{
        course_id: assignment.courseId,
        title: assignment.title,
        due_date: assignment.dueDate,
        type: assignment.type,
        status: 'todo',
        estimated_hours: assignment.estimatedHours
      }]);

    if (error) showToast('Error', 'Insertion failed.', 'error');
    else fetchData();
  };

  const bulkAddAssignments = async (assignmentsList: any[]) => {
    const { error } = await supabase
      .from('assignments')
      .insert(assignmentsList);

    if (error) {
      showToast('Error', 'Bulk insertion failed.', 'error');
      throw error;
    }
    fetchData();
  };

  const updateAssignmentStatus = async (id: string, status: Assignment['status']) => {
    const { error } = await supabase.from('assignments')
      .update({ 
        status, 
        completed_at: status === 'completed' ? new Date().toISOString() : null 
      })
      .eq('id', id);
    
    if (error) showToast('Error', 'Handshake failed.', 'error');
    else fetchData();
  };

  const updateAssignment = async (a: Assignment) => {
    const { error } = await supabase.from('assignments')
      .update({
        title: a.title,
        course_id: a.courseId,
        due_date: a.dueDate,
        type: a.type,
        estimated_hours: a.estimatedHours
      })
      .eq('id', a.id);

    if (error) showToast('Error', 'Override failed.', 'error');
    else fetchData();
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (!error) {
      showToast('Deleted', 'Assignment purged from system.', 'success');
      fetchData();
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-2xl animate-spin shadow-2xl shadow-blue-600/20" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 animate-pulse">Initializing Mainframe...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthView />;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          {currentView === 'dashboard' && (
            <Dashboard 
              courses={courses} 
              assignments={assignments} 
              updateStatus={updateAssignmentStatus} 
              setView={setCurrentView} 
            />
          )}
          {currentView === 'assignments' && (
            <AssignmentList 
              courses={courses} 
              assignments={assignments} 
              addAssignment={addAssignment} 
              updateStatus={updateAssignmentStatus} 
              deleteAssignment={deleteAssignment} 
              updateAssignment={updateAssignment}
            />
          )}
          {currentView === 'courses' && (
            <CourseList 
              courses={courses} 
              addCourse={addCourse} 
              deleteCourse={deleteCourse} 
              bulkAddAssignments={bulkAddAssignments}
            />
          )}
          {currentView === 'timer' && <StudyTimer courses={courses} />}
          {currentView === 'ai' && (
            <AIChat 
              assignments={assignments} 
              courses={courses} 
              updateAssignmentStatus={updateAssignmentStatus} 
            />
          )}
          {currentView === 'wellness' && <Wellness />}
          {/* IntegrationsHub extracted for system stability */}
          {currentView === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
}