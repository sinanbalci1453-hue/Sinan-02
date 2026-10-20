import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline capabilities and home-screen installability
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] Service Worker başarıyla kaydedildi, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] /sw.js kayıt hatası:', err);
        try {
          registerSW({ immediate: true });
        } catch {}
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

