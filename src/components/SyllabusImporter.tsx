/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, Zap } from 'lucide-react';
import { parseSyllabus } from '../services/geminiService';
import { SyllabusData } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as pdfjs from 'pdfjs-dist';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface SyllabusImporterProps {
  onImport: (data: SyllabusData) => void;
  onClose: () => void;
}

export function SyllabusImporter({ onImport, onClose }: SyllabusImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleFile = async (file: File) => {
    const supportedTypes = ['application/pdf', 'text/plain', 'text/html'];
    if (!supportedTypes.includes(file.type) && !file.name.endsWith('.html')) {
      setError('Unsupported file type. Use PDF, Text, or HTML.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }

      if (!text.trim()) throw new Error('No text found in file.');

      const data = await parseSyllabus(text, startDate || undefined);
      onImport(data);
    } catch (err: any) {
      setError(err.message || 'AI parsing failed. Try pasting the text instead.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const data = await parseSyllabus(pastedText, startDate || undefined);
      onImport(data);
    } catch (err: any) {
      setError('Could not identify course structure. Ensure the text includes assignments.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-8 md:p-12 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Zap size={28} fill="currentColor" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">AI Syllabus Sync</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Instant academic extraction.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
              <X size={32} />
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold">
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Term Start Date</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-blue-500 outline-none transition-all dark:text-white font-bold"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Option 1: Industrial Scan</h3>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "h-52 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer transition-all",
                    dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" accept=".pdf,.txt,.html" />
                  {isProcessing ? <Loader2 size={40} className="text-blue-600 animate-spin" /> : <Upload size={40} className="text-slate-300 dark:text-slate-700" />}
                  <div className="text-center">
                    <p className="text-sm font-black dark:text-white uppercase tracking-tighter">{isProcessing ? 'Processing Rebar...' : 'Drop Syllabus PDF'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Maximum Voltage Extraction</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Option 2: Raw Input</h3>
              <div className="space-y-4">
                <textarea 
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste raw syllabus text here..."
                  className="w-full h-52 p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] focus:border-blue-500 outline-none transition-all dark:text-white text-sm font-medium resize-none"
                />
                <button 
                  onClick={handlePasteSubmit}
                  disabled={!pastedText.trim() || isProcessing}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  Begin Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}