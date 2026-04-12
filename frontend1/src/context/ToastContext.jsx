// src/context/ToastContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext(null);
let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = 'info', ms = 4000) => {
    const id = ++_id;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);

  const toast = {
    success: m => push(m, 'success'),
    error:   m => push(m, 'error'),
    warning: m => push(m, 'warning'),
    info:    m => push(m, 'info'),
  };

  const cfg = {
    success: { bg: 'bg-success-50 border-success-500', icon: '✓', color: 'text-success-700' },
    error:   { bg: 'bg-danger-50 border-danger-500',  icon: '✕', color: 'text-danger-700'  },
    warning: { bg: 'bg-warning-50 border-warning-500',icon: '⚠', color: 'text-warning-600' },
    info:    { bg: 'bg-primary-50 border-primary-500',icon: 'ℹ', color: 'text-primary-700' },
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const c = cfg[t.type];
          return (
            <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border-l-4 shadow-xl bg-white min-w-[280px] max-w-sm animate-slide-up ${c.bg}`}>
              <span className={`font-800 text-base flex-shrink-0 ${c.color}`}>{c.icon}</span>
              <span className="text-sm text-gray-800 font-500">{t.msg}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};
