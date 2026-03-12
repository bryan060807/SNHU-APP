/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { IntegrationsHub } from './components/IntegrationsHub';
import { AuthView } from './components/Auth/AuthView';
import { Course, Assignment, View } from './types';
import { requestNotificationPermission, sendNotification } from './lib/notifications';
import { useToast } from './components/Toast';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Apply theme from the user's public profile (AIBRY Aesthetic)
  useEffect(() => {
    if (profile?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile?.theme]);

  // Personalized Birthday Celebration: June 13th Logic
  useEffect(() => {
    if (profile?.birthday) {
      const [, birthMonth, birthDay] = profile.birthday.split('-').map(Number);
      const today = new Date();
      if ((today.getMonth() + 1) === birthMonth && today.getDate() === birthDay) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#003057', '#3b82f6', '#ffffff']
        });
        showToast(`Happy Birthday!`, "Time to celebrate while you crush those modules.", 'success');
      }
    }
  }, [profile]);

  // Fetch data from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [coursesRes, assignmentsRes] = await Promise.all([
          supabase.from('courses').select('*'),
          supabase.from('assignments').select('*').order('due_date', { ascending: true })
        ]);

        if (coursesRes.data) setCourses(coursesRes.data);
        if (assignmentsRes.data) {
          setAssignments(assignmentsRes.data.map((a: any) => ({
            id: a.id,
            courseId: a.course_id,
            title: a.title,
            dueDate: a.due_date,
            type: a.type,
            status: a.status,
            estimatedHours: a.estimated_hours,
            completedAt: a.completed_at
          })));
        }
      } catch (error) {
        showToast('Sync Error', 'Failed to retrieve academic data.', 'error');
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();

    // Real-time subscription for instant updates across devices
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Mutation Handlers
  const addAssignment = async (assignment: Omit<Assignment, 'id'>) => {
    const { data, error } = await supabase
      .from('assignments')
      .insert([{
        course_id: assignment.courseId,
        title: assignment.title,
        due_date: assignment.dueDate,
        type: assignment.type,
        status: 'todo',
        estimated_hours: assignment.estimatedHours
      }])
      .select();

    if (error) showToast('Error', 'Could not save assignment.', 'error');
  };

  const updateAssignmentStatus = async (id: string, status: Assignment['status']) => {
    await supabase.from('assignments')
      .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
      .eq('id', id);
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (!error) {
      setAssignments(assignments.filter(a => a.id !== id));
      showToast('Deleted', 'Assignment removed.', 'success');
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-tighter">Syncing AIBRY Compass...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthView />;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#F8F9FA] dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8">
        <div className="max-w-5xl mx-auto">
          {currentView === 'dashboard' && (
            <Dashboard courses={courses} assignments={assignments} updateStatus={updateAssignmentStatus} setView={setCurrentView} />
          )}
          {currentView === 'assignments' && (
            <AssignmentList 
              courses={courses} 
              assignments={assignments} 
              addAssignment={addAssignment} 
              updateStatus={updateAssignmentStatus} 
              deleteAssignment={deleteAssignment} 
            />
          )}
          {currentView === 'courses' && (
            <CourseList 
              courses={courses} 
              addCourse={async (c) => { await supabase.from('courses').insert([c]); }} 
              deleteCourse={(id) => supabase.from('courses').delete().eq('id', id)} 
              bulkAddAssignments={async (a) => { await supabase.from('assignments').insert(a); }}
            />
          )}
          {currentView === 'timer' && <StudyTimer courses={courses} />}
          {currentView === 'ai' && (
            <AIChat assignments={assignments} courses={courses} updateAssignmentStatus={updateAssignmentStatus} />
          )}
          {currentView === 'wellness' && <Wellness />}
          {currentView === 'integrations' && <IntegrationsHub />}
          {currentView === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
}