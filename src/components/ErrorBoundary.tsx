import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  label?: string; // e.g. "Social Feed" for error messaging
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label ?? 'unknown'}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40vh',
          gap: '12px',
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <p style={{ fontWeight: 600, color: 'var(--text)' }}>
            {this.props.label ? `${this.props.label} failed to load` : 'Something went wrong'}
          </p>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, maxWidth: 300 }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 8,
              padding: '8px 20px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
