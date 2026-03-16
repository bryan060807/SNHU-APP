/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, ArrowLeft, GraduationCap, Globe, Lock } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 lg:p-20 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-6">
          <a href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-blue-600 transition-colors">
            <ArrowLeft size={14} /> Return to Mainframe
          </a>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Privacy Policy</h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2">
                <Globe size={14} className="animate-pulse" /> Data Extraction Protocol // v1.0
              </p>
            </div>
            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-blue-600 shadow-2xl">
              <ShieldCheck size={40} />
            </div>
          </div>
        </header>

        <main className="bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800 p-10 md:p-16 shadow-2xl space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-blue-600 text-sm font-black italic">01 //</span> Infrastructure Overview
            </h2>
            <p className="font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              SNHU Compass (the "Application") is an academic tool developed by Bryan Miller (AIBRY) for educational purposes. This policy outlines our commitment to data transparency, specifically regarding information extracted via Google OAuth 2.0.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-blue-600 text-sm font-black italic">02 //</span> Google Restricted Scopes
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Mandatory Disclosure for Google Verification</p>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 group transition-all hover:border-blue-500/50">
                <h4 className="font-black text-blue-600 uppercase italic tracking-tighter mb-2">Calendar & Tasks Access</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">We access your schedule and objectives to provide a unified dashboard. We do not modify, delete, or share your events. This data is processed in-memory and is not stored on our permanent servers.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 group transition-all hover:border-blue-500/50">
                <h4 className="font-black text-blue-600 uppercase italic tracking-tighter mb-2">Drive Metadata Access</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">We access file metadata (names and web links) to display your recent academic documents. SNHU Compass does not read the contents of your files or store copies of them.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-blue-600 text-sm font-black italic">03 //</span> Data Transmission
            </h2>
            <div className="flex gap-4 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border-2 border-blue-100 dark:border-blue-900/30">
              <Lock className="text-blue-600 shrink-0" size={24} />
              <p className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-tight italic">
                All data is encrypted via industrial-grade SSL during transit. Your local biometrics and assignment data are protected by Supabase's hardened authentication protocols.
              </p>
            </div>
          </section>

          <section className="space-y-4 pt-6">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-blue-600 text-sm font-black italic">04 //</span> Termination & Revocation
            </h2>
            <p className="font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              Users may terminate the Neural Link and revoke data access at any time via the Application Settings or through the Google Account Security Dashboard. Revocation results in immediate cessation of data extraction.
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