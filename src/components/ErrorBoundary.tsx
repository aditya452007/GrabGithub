import React from 'react';

// React class component ErrorBoundary — using declaration merging
// to work around useDefineForClassFields: false in tsconfig

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// We use a plain class with `any` type to bypass the tsconfig
// useDefineForClassFields issue, then export with proper types
const ErrorBoundaryClass = class extends (React.Component as any)<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    const state = (this as any).state as ErrorBoundaryState;
    const props = (this as any).props as ErrorBoundaryProps;

    if (state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-base)',
        }}>
          <div style={{
            textAlign: 'center',
            padding: '40px',
            maxWidth: '440px',
            background: 'var(--bg-surface)',
            borderRadius: '24px',
            boxShadow: 'var(--neo-raised)',
          }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>💥</div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '8px',
              fontFamily: "'Nunito', sans-serif",
            }}>
              Something went wrong
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '24px',
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.6,
            }}>
              {state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 28px',
                borderRadius: '14px',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                color: 'white',
                background: 'var(--accent-primary)',
                boxShadow: 'var(--neo-raised-sm)',
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
                transition: 'all 0.3s ease',
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return props.children;
  }
} as unknown as React.ComponentClass<ErrorBoundaryProps>;

export const ErrorBoundary = ErrorBoundaryClass;
