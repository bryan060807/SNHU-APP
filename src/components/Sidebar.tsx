/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  const { user, signOut } = useAuth(); // Updated to match your AuthContext
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const Notification = (window as any).Notification;
    if (Notification) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    showToast('Requesting Permission', 'Please look for the browser prompt.', 'info');

    if (!('Notification' in window)) {
      showToast('Not Supported', 'Browser does not support desktop notifications.', 'error');
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
        showToast('Notifications Blocked', 'Enable in browser settings and refresh.', 'error');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      showToast('Permission Error', 'Try opening in a new tab.', 'error');
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
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r-2 border-slate-100 dark:border-slate-800 flex-col h-full transition-colors duration-300 overflow-y-auto shadow-2xl">
        <div className="p-8 flex items-center gap-4 border-b-2 border-slate-50 dark:border-slate-800/50">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="font-black text-slate-900 dark:text-white tracking-tighter italic uppercase text-lg">SNHU</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black tracking-[0.2em] uppercase">Compass</p>
          </div>
        </div>

        <div className="p-6 border-b-2 border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border-2 border-white dark:border-slate-800">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                {user?.full_name || 'Student'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate font-bold uppercase">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group font-black uppercase text-[11px] tracking-widest",
                  isActive 
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-1" 
                    : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon size={18} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-blue-500")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t-2 border-slate-50 dark:border-slate-800/50 space-y-4">
          <button 
            onClick={requestPermission}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
              notifPermission === 'granted' 
                ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" 
                : "bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 animate-pulse"
            )}
          >
            <div className="flex items-center gap-2">
              {notifPermission === 'granted' ? <Bell size={14} /> : <BellOff size={14} />}
              <span>{notifPermission === 'granted' ? 'SYNCED' : 'OFFLINE'}</span>
            </div>
          </button>

          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-rose-500 transition-all font-black uppercase text-[10px] tracking-widest"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Updated for AIBRY) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t-2 border-slate-100 dark:border-slate-800 px-4 py-3 z-50 flex justify-around items-center">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all",
                isActive ? "text-blue-600 scale-110" : "text-slate-400"
              )}
            >
              <Icon size={22} />
              <span className="text-[8px] font-black uppercase tracking-widest">{item.id.substring(0, 3)}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1.5 p-2 text-slate-400"
        >
          <Menu size={22} />
          <span className="text-[8px] font-black uppercase tracking-widest">MORE</span>
        </button>
      </nav>

      {/* Mobile Fullscreen Menu (Simplified for brevity, use existing logic) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white dark:bg-slate-950 z-[60] flex flex-col p-8">
            <div className="flex justify-between items-center mb-12">
               <h2 className="text-3xl font-black italic uppercase tracking-tighter">System</h2>
               <button onClick={() => setIsMobileMenuOpen(false)}><X size={32} /></button>
            </div>
            <div className="space-y-4">
              {menuItems.map(item => (
                <button 
                   key={item.id}
                   onClick={() => { setView(item.id as View); setIsMobileMenuOpen(false); }}
                   className="w-full p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] text-left font-black uppercase tracking-widest flex items-center gap-4"
                >
                  <item.icon size={24} className="text-blue-600" />
                  {item.label}
                </button>
              ))}
              <button onClick={signOut} className="w-full p-6 text-rose-500 font-black uppercase tracking-widest flex items-center gap-4">
                <LogOut size={24} /> Logout
              </button>
            </div>
        </div>
      )}
    </>
  );
}