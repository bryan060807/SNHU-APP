import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, CheckCircle, AlertCircle } from 'lucide-react';

type ToastType = 'info' | 'success' | 'error';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex gap-4 items-start"
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${
                toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                toast.type === 'error' ? 'bg-rose-50 text-rose-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {toast.type === 'success' ? <CheckCircle size={20} /> :
                 toast.type === 'error' ? <AlertCircle size={20} /> :
                 <Bell size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-sm">{toast.title}</h4>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
