'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New version available and cached.');
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.warn('[PWA] ServiceWorker registration warning:', error);
          });
      };

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker);
      }

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
        }
      });
    }
  }, []);

  return null;
}
