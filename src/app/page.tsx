'use client';

import { useEffect, useState } from 'react';
import { AppProvider } from '../context/AppContext';
import { CartProvider } from '../context/CartContext';
import App from '../App';
import { logError } from '../lib/errorLogger';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Global Error Catching (migrated from main.tsx)
    window.onerror = (message, source, lineno, colno, error) => {
      logError(error || { message, source, lineno, colno }, 'window_onerror');
    };

    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      logError(event.reason, 'unhandled_rejection');
    };

    // Service worker registration handled by next-pwa automatically
  }, []);

  // Prevent SSR flash — wait for client mount
  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000'
      }}>
        <div className="animate-spin" style={{
          width: 48,
          height: 48,
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTop: '3px solid #8b5cf6',
          borderRadius: '50%'
        }} />
      </div>
    );
  }

  return (
    <AppProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AppProvider>
  );
}
