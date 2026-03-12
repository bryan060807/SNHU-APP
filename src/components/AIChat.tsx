import React, { useState, useRef, useEffect } from 'react';
import { Assignment, Course } from '../types';
import { Send, Bot, User, Sparkles, Loader2, BookOpen, Clock, Trash2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { getStudyAdvice, generateSpeech } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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

import { useAuth } from '../contexts/AuthContext';

export function AIChat({ assignments, courses, updateAssignmentStatus }: AIChatProps) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTalkMode, setIsTalkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSpeakingRef = useRef(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Automatically send if in talk mode
        if (isTalkMode) {
          setTimeout(() => handleSend(undefined, transcript), 500);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopSpeaking();
    };
  }, [isTalkMode]);

  const stopSpeaking = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {}
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      stopSpeaking();
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const playResponse = async (text: string) => {
    if (!isTalkMode) return;
    
    stopSpeaking();
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Split text into sentences for faster initial response
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    for (const sentence of sentences) {
      if (signal.aborted || !isTalkMode) break;

      const base64Audio = await generateSpeech(sentence.trim(), user?.ai_voice || 'Kore');
      
      if (signal.aborted || !isTalkMode) break;

      if (base64Audio) {
        const byteCharacters = atob(base64Audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        await playRawPcm(byteArray, signal);
      }
    }
    
    if (!signal.aborted) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  };

  const playRawPcm = (pcmData: Uint8Array, signal: AbortSignal) => {
    return new Promise<void>((resolve) => {
      if (signal.aborted) return resolve();

      const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = context;
      
      const buffer = context.createBuffer(1, pcmData.length / 2, 24000);
      const channelData = buffer.getChannelData(0);
      
      const view = new DataView(pcmData.buffer);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = view.getInt16(i * 2, true) / 32768;
      }
      
      const source = context.createBufferSource();
      sourceRef.current = source;
      source.buffer = buffer;
      source.connect(context.destination);
      
      source.onended = () => {
        if (sourceRef.current === source) {
          sourceRef.current = null;
          if (context.state !== 'closed') {
            context.close().catch(() => {});
          }
          resolve();
        }
      };

      source.start();

      signal.addEventListener('abort', () => {
        try {
          source.stop();
        } catch (e) {}
        if (context.state !== 'closed') {
          context.close().catch(() => {});
        }
        resolve();
      }, { once: true });
    });
  };

  // Fetch history on mount
  useEffect(() => {
    if (!token) return;
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/chat/messages', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const history = await response.json();
          if (history.length > 0) {
            setMessages(history);
          } else {
            setMessages([{ 
              id: '1', 
              role: 'assistant', 
              content: `Hi ${user?.name || ''}! I'm your SNHU Study Buddy. I can help you break down assignments, plan your study week, or explain concepts from your courses. What's on your mind?` 
            }]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };
    fetchHistory();
  }, [token, user?.name]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const saveMessage = async (msg: Message) => {
    if (!token) return;
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(msg)
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  const clearHistory = async () => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to clear your chat history?')) return;
    
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setMessages([{ 
          id: '1', 
          role: 'assistant', 
          content: `Hi ${user?.name || ''}! I've cleared our history. How can I help you today?` 
        }]);
      } else {
        console.error('Failed to clear history on server');
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handleSend = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const messageContent = overrideInput || input;
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    saveMessage(userMessage);
    setInput('');
    setIsLoading(true);

    // Create context from current assignments
    const upcoming = assignments
      .filter(a => a.status !== 'completed')
      .map(a => `- ${a.title} (ID: ${a.id}, Due: ${new Date(a.dueDate).toLocaleDateString()}, Status: ${a.status})`)
      .join('\n');
    
    // Get mood context
    const moodData = JSON.parse(localStorage.getItem('moodCheckIns') || '[]');
    const lastMood = moodData.length > 0 ? moodData[moodData.length - 1] : null;
    const moodContext = lastMood 
      ? `\n\nUser's Recent Mood Check-in: Stress: ${lastMood.stress}/5, Energy: ${lastMood.energy}/5, Focus: ${lastMood.focus}/5. Notes: ${lastMood.notes || 'None'}.`
      : '';
    
    const context = `
      User Profile:
      - Name: ${user?.name}
      - Major/Knowledge Base: ${user?.ai_knowledge_base || 'Not specified'}
      - Memory/Context: ${user?.ai_memory || 'Not specified'}
      - Preferred AI Personality: ${user?.ai_personalization || 'Supportive academic assistant'}
      ${moodContext}

      Upcoming Assignments:
      ${upcoming}
    `;
    const prompt = `${context}\n\nStudent: ${messageContent}`;

    const result = await getStudyAdvice(prompt, messages.slice(-10)); // Pass last 10 messages for context
    
    let assistantContent = result.text || "";

    // Handle function calls
    if (result.functionCalls) {
      for (const call of result.functionCalls) {
        if (call.name === 'updateAssignmentStatus') {
          const { assignmentId, status } = call.args as any;
          const assignment = assignments.find(a => a.id === assignmentId);
          if (assignment) {
            await updateAssignmentStatus(assignmentId, status);
            assistantContent += `\n\n*(System: I've updated the status of "${assignment.title}" to ${status})*`;
          }
        }
      }
    }

    const assistantMessage: Message = { 
      id: (Date.now() + 1).toString(), 
      role: 'assistant', 
      content: assistantContent || "I've processed your request." 
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    saveMessage(assistantMessage);
    setIsLoading(false);

    // Speak response if in talk mode
    if (isTalkMode && assistantContent) {
      // Strip markdown for cleaner speech
      const cleanText = assistantContent.replace(/[#*`_]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
      playResponse(cleanText);
    }
  };

  const getSuggestions = () => {
    const base = ["Plan my week", "7-3-1 rule"];
    if (courses.length > 0) {
      const courseSuggestions = courses.slice(0, 2).map(c => `Tips for ${c.code}`);
      const assignmentSuggestions = assignments
        .filter(a => a.status !== 'completed')
        .slice(0, 1)
        .map(a => `Help with ${a.title}`);
      return [...courseSuggestions, ...assignmentSuggestions, ...base];
    }
    return ["Plan my week", "Break down discussion", "SNHU-107 tips", "7-3-1 rule"];
  };

  const suggestions = getSuggestions();

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <header className="mb-4 md:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">AI Study Buddy</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Your personal SNHU academic assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const next = !isTalkMode;
              setIsTalkMode(next);
              if (!next) stopSpeaking();
            }}
            className={cn(
              "p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
              isTalkMode 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
            title={isTalkMode ? "Disable Talk Mode" : "Enable Talk Mode"}
          >
            {isTalkMode ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span className="hidden md:inline">{isTalkMode ? 'Talk Mode On' : 'Talk Mode Off'}</span>
          </button>
          <button 
            onClick={clearHistory}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scroll-smooth"
        >
          {messages.map((m) => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3 md:gap-4 max-w-[90%] md:max-w-[85%]",
                m.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-7 h-7 md:w-8 md:h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
                m.role === 'assistant' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              )}>
                {m.role === 'assistant' ? <Bot size={16} className="md:w-[18px] md:h-[18px]" /> : <User size={16} className="md:w-[18px] md:h-[18px]" />}
              </div>
              <div className={cn(
                "p-3 md:p-4 rounded-2xl text-xs md:text-sm leading-relaxed",
                m.role === 'assistant' 
                  ? "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none" 
                  : "bg-[#003057] text-white rounded-tr-none"
              )}>
                <div className="markdown-body prose prose-sm max-w-none prose-slate dark:prose-invert">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-3 md:gap-4">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 md:p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium italic">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 md:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
              {suggestions.map((s) => (
                <button 
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="text-[10px] md:text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask anything..."}
                className={cn(
                  "w-full pl-4 pr-12 py-3 md:py-4 bg-white dark:bg-slate-800 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm text-slate-900 dark:text-white",
                  isListening ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 dark:border-slate-700"
                )}
              />
              <button 
                type="button"
                onClick={toggleListening}
                className={cn(
                  "absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all",
                  isListening 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
            <button 
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 md:w-12 md:h-12 bg-[#003057] text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900 transition-all flex-shrink-0"
            >
              <Send size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
          </form>
          {isSpeaking && (
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 12, 4] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                    className="w-1 bg-blue-500 rounded-full"
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Speaking...</span>
              <button 
                onClick={stopSpeaking}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg transition-all"
              >
                Stop
              </button>
            </div>
          )}
          <p className="text-[9px] md:text-[10px] text-center text-slate-400 mt-2 md:mt-3 font-medium uppercase tracking-widest">
            Powered by Gemini AI • SNHU Academic Buddy
          </p>
        </div>
      </div>
    </div>
  );
}
