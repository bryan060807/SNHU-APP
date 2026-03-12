/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';

// Graceful Error Boundary Component
class GlobalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught SNHU-APP Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-slate-950 text-white p-6 text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-black mb-4 tracking-tighter uppercase text-rose-500">System Failure</h1>
            <p className="text-slate-400 mb-8 font-medium">
              The academic compass hit a snag. This usually happens due to a sync error or a missing database table.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors"
            >
              Reload System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);