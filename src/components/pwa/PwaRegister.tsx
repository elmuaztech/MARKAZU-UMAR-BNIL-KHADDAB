'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register Service Worker on page load
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

          // 1. Enable Automatic Background Sync (when connection drops and reconnects)
          if ('sync' in registration) {
            try {
              await (registration as any).sync.register('markazu-auto-sync');
              console.log('[PWA] Background sync registered successfully.');
            } catch (syncErr) {
              console.warn('[PWA] Background sync registration note:', syncErr);
            }
          }

          // 2. Enable Periodic Background Sync (periodic sync in background)
          if ('periodicSync' in registration) {
            try {
              const status = await (navigator as any).permissions.query({
                name: 'periodic-background-sync',
              });
              if (status.state === 'granted' || status.state === 'prompt') {
                await (registration as any).periodicSync.register('markazu-periodic-sync', {
                  minInterval: 12 * 60 * 60 * 1000, // Sync periodically every 12 hours
                });
                console.log('[PWA] Periodic background sync registered successfully.');
              }
            } catch (pSyncErr) {
              console.warn('[PWA] Periodic sync registration note:', pSyncErr);
            }
          }

          // 3. Monitor updates to service worker
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
        } catch (error) {
          console.warn('[PWA] ServiceWorker registration warning:', error);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }

      // 4. Handle messages from Service Worker (e.g. background sync triggers)
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'TRIGGER_AUTO_SYNC' || event.data?.type === 'TRIGGER_PERIODIC_SYNC') {
          console.log('[PWA] Received sync message from Service Worker, triggering refresh...');
          window.dispatchEvent(new CustomEvent('markazu:auto-sync'));
        }
      };
      navigator.serviceWorker.addEventListener('message', handleMessage);

      // Handle controllerchange (seamless worker takeover)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
        }
      });

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  return null;
}
