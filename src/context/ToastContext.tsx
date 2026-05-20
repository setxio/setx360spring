'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Hook ────────────────────────────────────────────────────────────────────
export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

// ─── Icons ───────────────────────────────────────────────────────────────────
const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)', icon: '#10b981' },
  error:   { bg: 'rgba(239, 68, 68, 0.12)',  border: 'rgba(239, 68, 68, 0.4)',  icon: '#ef4444' },
  info:    { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.4)', icon: '#6366f1' },
  warning: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)', icon: '#f59e0b' },
};

// ─── Individual Toast ─────────────────────────────────────────────────────────
const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const c = colors[toast.type];
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger enter animation on next frame
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      onClick={handleDismiss}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        borderRadius: '14px',
        background: 'rgba(18, 18, 28, 0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${c.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${c.border} inset`,
        cursor: 'pointer',
        maxWidth: '360px',
        width: '100%',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        userSelect: 'none',
      }}
    >
      {/* Icon badge */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: c.bg,
        border: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontSize: '14px', fontWeight: 700,
        color: c.icon,
      }}>
        {icons[toast.type]}
      </div>

      {/* Message */}
      <span style={{
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#f1f5f9',
        lineHeight: 1.4,
        flex: 1,
      }}>
        {toast.message}
      </span>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '2px',
        borderRadius: '0 0 14px 14px',
        background: c.icon,
        opacity: 0.5,
        animation: `toast-progress ${toast.duration ?? 3500}ms linear forwards`,
      }} />
    </div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `toast-${++counterRef.current}-${Date.now()}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]); // max 5 visible
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast]);
  const error   = useCallback((msg: string) => toast(msg, 'error', 5000), [toast]);
  const info    = useCallback((msg: string) => toast(msg, 'info'), [toast]);
  const warning = useCallback((msg: string) => toast(msg, 'warning', 4000), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center',
          pointerEvents: 'none',
          width: '100%',
          maxWidth: '400px',
          padding: '0 16px',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all', width: '100%' }}>
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>

      {/* Keyframe for progress bar */}
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
