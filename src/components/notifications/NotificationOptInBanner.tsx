'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { PushNotificationManager } from '@/lib/pushNotifications';

export function NotificationOptInBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if notifications are supported and in 'default' (unasked) state
    if (
      PushNotificationManager.isSupported() &&
      PushNotificationManager.getPermission() === 'default' &&
      !PushNotificationManager.isOptInDismissed()
    ) {
      // Delay slightly so it feels natural after dashboard loads
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showBanner) return null;

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const permission = await PushNotificationManager.requestPermission();
      setShowBanner(false);
      if (permission === 'granted') {
        PushNotificationManager.showNotification({
          title: 'Notifications Enabled!',
          body: 'You will now receive instant Markazu Umar announcements and school alerts.',
        });
      }
    } catch (err) {
      console.warn('Failed to enable notifications:', err);
      setShowBanner(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    PushNotificationManager.dismissOptIn();
    setShowBanner(false);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
        </div>
        <p className="font-medium truncate">
          <strong>Enable Notifications:</strong> Get real-time alerts for student attendance, results, and school notices.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleEnable}
          disabled={isRequesting}
          className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-all shadow-xs"
        >
          {isRequesting ? 'Requesting...' : 'Enable'}
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          title="Dismiss"
          aria-label="Dismiss notification banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
