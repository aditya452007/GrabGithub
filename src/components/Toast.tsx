import React, { useEffect, useState } from 'react';
import { X, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  duration?: number; // ms, default 4000
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [exiting, setExiting] = useState(false);
  const duration = toast.duration || 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const iconMap = {
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    success: <CheckCircle size={20} />,
    info: <Info size={20} />,
  };

  const colorMap = {
    error: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', icon: '#ef4444', text: '#fca5a5' },
    warning: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', icon: '#f59e0b', text: '#fcd34d' },
    success: { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', icon: '#22c55e', text: '#86efac' },
    info: { bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', icon: '#a855f7', text: '#c4b5fd' },
  };

  const colors = colorMap[toast.type];

  return (
    <div
      className={exiting ? 'toast-exit' : 'toast-enter'}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: '14px 16px',
        boxShadow: 'var(--neo-raised)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        minWidth: '320px',
        maxWidth: '420px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Icon */}
      <div style={{ color: colors.icon, flexShrink: 0, marginTop: '2px' }}>
        {iconMap[toast.type]}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '14px',
          color: colors.icon,
          marginBottom: '2px',
        }}>
          {toast.title}
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
        }}>
          {toast.message}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px',
          flexShrink: 0,
          borderRadius: '6px',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>

      {/* Countdown progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        background: colors.icon,
        borderRadius: '0 0 16px 16px',
        animation: `countdown ${duration}ms linear forwards`,
        opacity: 0.6,
      }} />
    </div>
  );
};

// Toast context and provider
let toastIdCounter = 0;
let addToastGlobal: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function showToast(toast: Omit<Toast, 'id'>) {
  if (addToastGlobal) {
    addToastGlobal(toast);
  }
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastGlobal = (toast) => {
      const id = `toast-${++toastIdCounter}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
    };
    return () => { addToastGlobal = null; };
  }, []);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onDismiss={handleDismiss} />
        </div>
      ))}
    </div>
  );
};
