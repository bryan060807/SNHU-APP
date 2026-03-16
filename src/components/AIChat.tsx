/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Assignment, Course } from '../types';
import { Send, Bot, User, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { getStudyAdvice } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AIChatProps {
  assignments: Assignment[];
  courses: Course[];
  updateAssignmentStatus: (id: string, status: Assignment['status']) => Promise<void>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIChat({ assignments, courses, updateAssignmentStatus }: AIChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch history from Supabase
  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setMessages(data.map(m => ({ id: m.id, role: m.role, content: m.content })));
      } else {
        setMessages([{ 
          id: '1', 
          role: 'assistant', 
          content: `Systems Online, ${user.full_name?.split(' ')[0] || 'Scholar'}. Neural link established. How can I assist with your SNHU modules today?` 
        }]);
      }
    };
    fetchHistory();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await supabase.from('chat_history').insert([{ user_id: user.id, role: 'user', content: input }]);

    const upcoming = assignments
      .filter(a => a.status !== 'completed')
      .map(a => `- ${a.title} (Due: ${new Date(a.dueDate).toLocaleDateString()})`)
      .join('\n');
    
    const prompt = `
      [IDENTITY_LINK]
      User: ${user.full_name}
      [ACADEMIC_CONTEXT]
      Upcoming Tasks:
      ${upcoming}
      [USER_INPUT]
      ${input}
    `;

    const result = await getStudyAdvice(prompt, messages.slice(-10));
    const assistantContent = result.text || "Neural link timed out. Please retry.";

    const assistantMessage: Message = { 
      id: (Date.now() + 1).toString(), 
      role: 'assistant', 
      content: assistantContent 
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);

    await supabase.from('chat_history').insert([{ user_id: user.id, role: 'assistant', content: assistantContent }]);
  };

  const clearHistory = async () => {
    if (!user || !window.confirm('Wipe neural history?')) return;
    await supabase.from('chat_history').delete().eq('user_id', user.id);
    setMessages([{ id: '1', role: 'assistant', content: 'History purged. System reset.' }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)] max-w-5xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Neural Buddy</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Text-Only Logic Channel</p>
          </div>
        </div>
        <button onClick={clearHistory} className="p-3 text-slate-400 hover:text-rose-500 transition-colors">
          <Trash2 size={20} />
        </button>
      </header>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
          {messages.map((m) => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-4 max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border-2",
                m.role === 'assistant' ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-slate-900 border-slate-800 text-white"
              )}>
                {m.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={cn(
                "p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm",
                m.role === 'assistant' ? "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none" : "bg-blue-600 text-white rounded-tr-none"
              )}>
                <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                  {m.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-12 w-24 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none" />
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t-2 border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSend} className="relative flex items-center w-full">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Initialize query..."
              className="w-full pl-6 pr-20 py-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] focus:border-blue-500 outline-none transition-all dark:text-white font-bold"
            />
            
            <button 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              <Send size={22} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}