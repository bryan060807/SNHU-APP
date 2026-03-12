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
  const { user, profile, isLoading } = useAuth();
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Apply theme from the user's public profile
  useEffect(() => {
    if (profile?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile?.theme]);

  // Personalized Birthday Celebration Logic
  useEffect(() => {
    if (profile?.birthday) {
      // Parses 'YYYY-MM-DD' from the Supabase profiles table
      const [, birthMonth, birthDay] = profile.birthday.split('-').map(Number);
      
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentDate = today.getDate();

      // Trigger if today matches the month and day in the user's settings
      if (currentMonth === birthMonth && currentDate === birthDay) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#003057', '#3b82f6', '#ffffff'] // SNHU-themed colors
        });
        
        showToast(
          `Happy Birthday, ${profile.full_name || 'Student'}!`, 
          "Enjoy your special day and keep crushing those modules!", 
          'success'
        );
      }
    }
  }, [profile]);

  // Fetch courses and assignments from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [coursesRes, assignmentsRes] = await Promise.all([
          supabase.from('courses').select('*'),
          supabase.from('assignments').select('*').order('due_date', { ascending: true })
        ]);

        if (coursesRes.data) setCourses(coursesRes.data);
        if (assignmentsRes.data) {
          // Map snake_case from DB to camelCase for the frontend
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
        console.error('Failed to fetch data from Supabase:', error);
        showToast('Sync Error', 'Failed to retrieve your academic data.', 'error');
      }
    };

    fetchData();
  }, [user]);

  // Background notification checker (runs every minute)
  useEffect(() => {
    if (!user) return;
    requestNotificationPermission();

    const sentNotifications = new Set<string>();

    const checkDeadlines = () => {
      const now = new Date();
      assignments.forEach(a => {
        if (a.status === 'completed') return;

        const dueDate = new Date(a.dueDate);
        const diffMs = dueDate.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        const thresholds = [
          { mins: 1440, label: '24 hours' },
          { mins: 60, label: '1 hour' },
          { mins: 15, label: '15 minutes' }
        ];

        thresholds.forEach(t => {
          const key = `${a.id}-${t.mins}`;
          if (diffMins === t.mins && !sentNotifications.has(key)) {
            const course = courses.find(c => c.id === a.courseId);
            sendNotification(`SNHU Deadline: ${a.title}`, {
              body: `Due in ${t.label} for ${course?.code || 'your course'}.`,
              tag: key
            }, showToast);
            sentNotifications.add(key);
          }
        });
      });
    };

    const interval = setInterval(checkDeadlines, 60000);
    checkDeadlines();

    return () => clearInterval(interval);
  }, [assignments, courses, user]);

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

    if (!error && data) {
      setAssignments([...assignments, { ...assignment, id: data[0].id }]);
      showToast('Success', 'Assignment saved.', 'success');
    }
  };

  const updateAssignmentStatus = async (id: string, status: Assignment['status']) => {
    const { error } = await supabase
      .from('assignments')
      .update({ 
        status, 
        completed_at: status === 'completed' ? new Date().toISOString() : null 
      })
      .eq('id', id);

    if (!error) {
      setAssignments(assignments.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Syncing Academic Compass...</p>
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
              deleteAssignment={(id) => supabase.from('assignments').delete().eq('id', id)} 
              updateAssignment={(updated) => console.log('Update logic needed')}
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