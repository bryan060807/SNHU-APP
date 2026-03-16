/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, CheckSquare, Timer, MessageSquare, 
  GraduationCap, Bell, BellOff, Menu, X, Settings as SettingsIcon, 
  LogOut, User, HeartPulse 
} from 'lucide-react';
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
  const { user, signOut } = useAuth();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const Notification = (window as any).Notification;
    if (Notification) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    showToast('Initialize Comms', 'Requesting biometric notification access...', 'info');

    if (!('Notification' in window)) {
      showToast('Hardware Error', 'Device does not support system notifications.', 'error');
      return;
    }

    try {
      const permission = await requestNotificationPermission();
      setNotifPermission(permission);
      
      if (permission === 'granted') {
        sendNotification('SNHU Compass', {
          body: 'Neural Link: Notifications are now active.',
        }, showToast);
      } else if (permission === 'denied') {
        showToast('Link Blocked', 'Enable in browser settings to resume sync.', 'error');
      }
    } catch (error) {
      showToast('Link Failure', 'Failed to initialize notification relay.', 'error');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'timer', label: 'Focus Engine', icon: Timer },
    { id: 'ai', label: 'AI Buddy', icon: MessageSquare },
    { id: 'wellness', label: 'Biometrics', icon: HeartPulse },
    { id: 'settings', label: 'System Config', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r-2 border-slate-100 dark:border-slate-800 flex-col h-full transition-all duration-300 overflow-y-auto shadow-2xl z-20">
        <div className="p-8 flex items-center gap-4 border-b-2 border-slate-50 dark:border-slate-800/50">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/40">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="font-black text-slate-900 dark:text-white tracking-tighter italic uppercase text-lg leading-none">SNHU</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black tracking-[0.2em] uppercase mt-1">Compass</p>
          </div>
        </div>

        {/* User Identity Section */}
        <div className="p-6 border-b-2 border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Biometric ID</p>
              <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase italic">
                {user?.full_name?.split(' ')[0] || 'Scholar'}
              </p>
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
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group font-black uppercase text-[10px] tracking-[0.15em] border-2",
                  isActive 
                    ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/30 -translate-y-0.5" 
                    : "text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon size={18} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-blue-500 transition-colors")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Status Footer */}
        <div className="p-6 border-t-2 border-slate-50 dark:border-slate-800/50 space-y-3">
          <button 
            onClick={requestPermission}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2",
              notifPermission === 'granted' 
                ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20" 
                : "bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/20 animate-pulse"
            )}
          >
            <div className="flex items-center gap-2">
              {notifPermission === 'granted' ? <Bell size={12} /> : <BellOff size={12} />}
              <span>{notifPermission === 'granted' ? 'Logic Relay Active' : 'Relay Offline'}</span>
            </div>
          </button>

          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Terminate Link</span>
          </button>

          {/* HARDENED LEGAL FOOTER FOR GOOGLE COMPLIANCE */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
             <a href="/privacy" target="_blank" className="text-[8px] font-black text-slate-300 hover:text-blue-500 uppercase tracking-[0.2em] transition-colors">Privacy</a>
             <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
             <a href="/tos" target="_blank" className="text-[8px] font-black text-slate-300 hover:text-blue-500 uppercase tracking-[0.2em] transition-colors">Terms</a>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t-2 border-slate-100 dark:border-slate-800 px-4 py-3 z-50 flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
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
              <Icon size={20} />
              <span className="text-[7px] font-black uppercase tracking-[0.2em]">{item.id.substring(0, 3)}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1.5 p-2 text-slate-400"
        >
          <Menu size={20} />
          <span className="text-[7px] font-black uppercase tracking-[0.2em]">MORE</span>
        </button>
      </nav>

      {/* Mobile Fullscreen Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white dark:bg-slate-950 z-[70] flex flex-col p-8 transition-all animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-12">
               <div className="flex items-center gap-3 text-blue-600">
                  <GraduationCap size={32} />
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">System Override</h2>
               </div>
               <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl"
               >
                 <X size={28} />
               </button>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {menuItems.map(item => (
                <button 
                   key={item.id}
                   onClick={() => { setView(item.id as View); setIsMobileMenuOpen(false); }}
                   className={cn(
                     "w-full p-5 rounded-[1.5rem] text-left font-black uppercase tracking-widest flex items-center gap-4 border-2 transition-all",
                     currentView === item.id 
                      ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20" 
                      : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                   )}
                >
                  <item.icon size={22} className={currentView === item.id ? "text-white" : "text-blue-600"} />
                  {item.label}
                </button>
              ))}
            </div>
            
            <div className="pt-8 space-y-6 border-t-2 border-slate-100 dark:border-slate-800">
              <div className="flex justify-center gap-8">
                 <a href="/privacy" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Privacy</a>
                 <a href="/tos" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terms</a>
              </div>
              <button 
                onClick={() => { signOut(); setIsMobileMenuOpen(false); }} 
                className="w-full p-5 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl shadow-rose-500/20"
              >
                <LogOut size={22} /> Terminate Connection
              </button>
            </div>
        </div>
      )}
    </>
  );
}