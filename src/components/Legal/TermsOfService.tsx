/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Scale, ArrowLeft, GraduationCap, Globe, ShieldAlert } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 lg:p-20 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-6">
          <a href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-blue-600 transition-colors">
            <ArrowLeft size={14} /> Return to Mainframe
          </a>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Terms of Service</h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2">
                <Globe size={14} className="animate-pulse" /> Operational Excellence Agreement // v1.0
              </p>
            </div>
            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-blue-600 shadow-2xl">
              <Scale size={40} />
            </div>
          </div>
        </header>

        <main className="bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800 p-10 md:p-16 shadow-2xl space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-blue-600 text-sm font-black italic">01 //</span> System Acceptance
            </h2>
            <p className="font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              By initializing the Neural Link and utilizing SNHU Compass, you agree to comply with these terms. This application is an educational prototype designed for academic management.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-blue-600 text-sm font-black italic">02 //</span> Liability Limitations
            </h2>
            <div className="bg-rose-50 dark:bg-rose-950/30 p-8 rounded-[2.5rem] border-2 border-rose-100 dark:border-rose-900 flex items-start gap-4">
              <ShieldAlert className="text-rose-600 shrink-0 mt-1" size={24} />
              <div className="space-y-2">
                <p className="font-black text-rose-600 uppercase text-xs tracking-widest">Warranties & Failures</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-300 uppercase leading-relaxed tracking-tight italic">
                  SNHU Compass is provided "AS IS." Bryan Miller (AIBRY) is not liable for missed SNHU deadlines, exam failures, or data sync latency caused by external API interruptions (Google, Supabase, Vercel).
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-blue-600 text-sm font-black italic">03 //</span> Intellectual Property
            </h2>
            <p className="font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              The AIBRY brand name, industrial visual design, and software architecture are protected intellectual property. Users are granted a limited, non-exclusive license for personal academic extraction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-blue-600 text-sm font-black italic">04 //</span> Mainframe Integrity
            </h2>
            <p className="font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              Any attempt to reverse-engineer the Application, bypass API rate limits, or "overclock" the system's request frequency will result in immediate termination of "System Access."
            </p>
          </section>
        </main>

        <footer className="text-center py-10">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest italic">
            <GraduationCap size={16} /> SNHU Academic Project // AIBRY Brand
          </div>
        </footer>
      </div>
    </div>
  );
}