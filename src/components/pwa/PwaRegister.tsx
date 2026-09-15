'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register Workbox Service Worker on page load
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            // Check for updates periodically
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
      });

      // Handle controllerchange (reload smoothly if new service worker takes over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          // Soft refresh or notification can occur here
        }
      });
    }
  }, []);

  return null;
}
