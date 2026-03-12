import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, FileText, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

export function IntegrationsHub() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [calRes, taskRes, driveRes] = await Promise.all([
          fetch('/api/google/calendar', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/google/tasks', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/google/drive', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (calRes.ok) setCalendarEvents(await calRes.json());
        if (taskRes.ok) setTasks(await taskRes.json());
        if (driveRes.ok) setDriveFiles(await driveRes.json());
      } catch (error) {
        showToast('Error', 'Failed to fetch integration data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token, showToast]);

  const deleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/google/calendar/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setCalendarEvents(calendarEvents.filter(e => e.id !== eventId));
        showToast('Success', 'Event deleted', 'success');
      }
    } catch (error) {
      showToast('Error', 'Failed to delete event', 'error');
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Integrations Hub</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your Google Calendar, Tasks, and Drive.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Calendar</h3>
          </div>
          <div className="space-y-4">
            {calendarEvents.map((event: any) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300">
                <a href={event.htmlLink} target="_blank" rel="noreferrer" className="flex-1 hover:text-blue-600">
                  <span className="block text-xs text-slate-400 dark:text-slate-500">{format(new Date(event.start.dateTime || event.start.date), 'MMM d')}</span>
                  {event.summary}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <CheckSquare size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tasks</h3>
          </div>
          <div className="space-y-4">
            {tasks.map((task: any) => (
              <a key={task.id} href="https://tasks.google.com/" target="_blank" rel="noreferrer" className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600">
                {task.title}
              </a>
            ))}
            <a href="https://tasks.google.com/" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Open Tasks <ExternalLink size={14} />
            </a>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-900/5 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Drive</h3>
          </div>
          <div className="space-y-4">
            {driveFiles.map((file: any) => (
              <a key={file.id} href={file.webViewLink} target="_blank" rel="noreferrer" className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600">
                {file.name}
              </a>
            ))}
            <a href="https://drive.google.com/" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline">
              Open Drive <ExternalLink size={14} />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
