import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, CheckSquare, Timer, MessageSquare, GraduationCap, Bell, BellOff, Menu, X, Settings as SettingsIcon, LogOut, User, HeartPulse, Database } from 'lucide-react';
import { View } from '../types';
import { cn } from '../lib/utils';
import { requestNotificationPermission, sendNotification } from '../lib/notifications';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
}

export function Sidebar({ currentView, setView }: SidebarProps) {
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const Notification = (window as any).Notification;
    if (Notification) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    showToast('Requesting Permission', 'Please look for the browser prompt at the top of your screen.', 'info');

    if (!('Notification' in window)) {
      showToast('Not Supported', 'Your browser does not support desktop notifications.', 'error');
      return;
    }

    try {
      const permission = await requestNotificationPermission();
      setNotifPermission(permission);
      
      if (permission === 'granted') {
        sendNotification('SNHU Compass', {
          body: 'System notifications are now active!',
        }, showToast);
      } else if (permission === 'denied') {
        showToast('Notifications Blocked', 'Please enable notifications in your browser settings and refresh.', 'error');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      showToast('Permission Error', 'Try opening the app in a new tab if the prompt doesn\'t appear.', 'error');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'ai', label: 'AI Buddy', icon: MessageSquare },
    { id: 'wellness', label: 'Wellness', icon: HeartPulse },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col h-full transition-colors duration-300 overflow-y-auto">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 bg-[#003057] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white leading-tight">SNHU</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">Compass</p>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Student'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-[#003057] text-white shadow-md shadow-blue-900/10" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon size={20} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <button 
            onClick={requestPermission}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all",
              notifPermission === 'granted' 
                ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" 
                : "bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/20"
            )}
          >
            <div className="flex items-center gap-2">
              {notifPermission === 'granted' ? <Bell size={14} /> : <BellOff size={14} />}
              <span>{notifPermission === 'granted' ? 'NOTIFICATIONS ON' : 'ENABLE REMINDERS'}</span>
            </div>
            {notifPermission !== 'granted' && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </button>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Quick Links</p>
            <div className="space-y-2">
              <a href="https://my.snhu.edu" target="_blank" rel="noreferrer" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-[#003057] dark:hover:text-white transition-colors">mySNHU Portal</a>
              <a href="https://learn.snhu.edu" target="_blank" rel="noreferrer" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-[#003057] dark:hover:text-white transition-colors">Brightspace</a>
              <a href="https://libguides.snhu.edu" target="_blank" rel="noreferrer" className="block text-sm text-slate-600 dark:text-slate-400 hover:text-[#003057] dark:hover:text-white transition-colors">Shapiro Library</a>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1 z-50 flex justify-around items-center transition-colors duration-300">
        {menuItems.filter(i => i.id !== 'settings').map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
                isActive ? "text-[#003057] dark:text-white" : "text-slate-400"
              )}
            >
              <Icon size={20} className={cn(isActive ? "text-[#003057] dark:text-white" : "text-slate-400")} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-2 text-slate-400"
        >
          <Menu size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">More</span>
        </button>
      </nav>

      {/* Mobile Fullscreen Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white dark:bg-slate-950 z-[60] flex flex-col transition-colors duration-300">
          <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#003057] rounded-xl flex items-center justify-center text-white">
                <GraduationCap size={24} />
              </div>
              <h1 className="font-bold text-slate-900 dark:text-white">SNHU Compass</h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <User size={24} />
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white">{user?.name || 'Student'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">App Settings</p>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => { setView('settings'); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  <SettingsIcon size={20} />
                  <span>Personalization & Theme</span>
                </button>
                <button 
                  onClick={requestPermission}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl text-sm font-bold transition-all",
                    notifPermission === 'granted' 
                      ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" 
                      : "bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {notifPermission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
                    <span>{notifPermission === 'granted' ? 'Notifications Active' : 'Enable Reminders'}</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Quick Links</p>
              <div className="grid grid-cols-1 gap-2">
                <a href="https://my.snhu.edu" target="_blank" rel="noreferrer" className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-300">mySNHU Portal</a>
                <a href="https://learn.snhu.edu" target="_blank" rel="noreferrer" className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-300">Brightspace</a>
                <a href="https://libguides.snhu.edu" target="_blank" rel="noreferrer" className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-300">Shapiro Library</a>
              </div>
            </div>

            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 p-4 text-red-600 font-bold"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
