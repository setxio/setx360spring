import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './context/AppContext'

import { logError } from './lib/errorLogger';

// Global Error Catching
window.onerror = (message, source, lineno, colno, error) => {
  logError(error || { message, source, lineno, colno }, 'window_onerror');
};

window.onunhandledrejection = (event) => {
  logError(event.reason, 'unhandled_rejection');
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)

// Register Service Worker for PWA Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
