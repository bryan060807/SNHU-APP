import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { parseSyllabus } from '../services/geminiService';
import { SyllabusData, Course, Assignment } from '../types';
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

  const extractTextFromHTML = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.innerText || doc.body.textContent || '';
  };

  const handleFile = async (file: File) => {
    const supportedTypes = ['application/pdf', 'text/plain', 'text/html'];
    if (!supportedTypes.includes(file.type) && !file.name.endsWith('.html')) {
      setError('Please upload a PDF, text, or HTML file.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
        const html = await file.text();
        text = extractTextFromHTML(html);
      } else {
        text = await file.text();
      }

      if (!text.trim()) {
        throw new Error('No text could be extracted from the file.');
      }

      const data = await parseSyllabus(text, startDate || undefined);
      onImport(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process the syllabus. Please try pasting the text instead.');
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
      setError('Failed to parse the text. Make sure it contains course and assignment details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Syllabus Importer</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Auto-populate your course and assignments.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Term Start Date (Optional)</label>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Recommended</span>
            </div>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white text-sm"
            />
            <p className="text-[10px] text-slate-400 italic">Providing this helps the AI calculate exact due dates for all 8 modules.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Option 1: Upload File</h3>
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                  dragActive 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" 
                    : "border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden" 
                  accept=".pdf,.txt,.html"
                />
                {isProcessing ? (
                  <Loader2 size={32} className="text-blue-500 animate-spin" />
                ) : (
                  <Upload size={32} className="text-slate-300 dark:text-slate-700" />
                )}
                <div className="text-center px-4">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {isProcessing ? 'Analyzing Syllabus...' : 'Drop PDF or HTML here'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, HTML, or Text files supported</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Option 2: Paste Text</h3>
              <div className="space-y-3">
                <textarea 
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste course overview or schedule text here..."
                  className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-blue-500 text-sm dark:text-white resize-none"
                />
                <button 
                  onClick={handlePasteSubmit}
                  disabled={!pastedText.trim() || isProcessing}
                  className="w-full py-3 bg-[#003057] text-white rounded-2xl font-bold hover:bg-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Analyze Text
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-widest mb-1">Pro Tip</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              For best results, upload the "Course Overview" or "Course Schedule" document. Our AI will automatically identify modules, assignments, and due dates.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
