// Markazu Umar bn Al-Khattab SMS - Push Notification & Device Alert Manager
// Compatible with modern mobile browsers, PWAs, and desktop push standards

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export class PushNotificationManager {
  /**
   * Check if Native Notifications & Service Workers are supported in the current environment
   */
  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current permission state: 'granted' | 'denied' | 'default'
   */
  public static getPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request user permission for native push notifications
   */
  public static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.warn('[PushNotificationManager] Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Display a native device notification via the active Service Worker (preferred on mobile)
   * or standard Notification API fallback
   */
  public static async showNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    const title = payload.title || 'Markazu Umar SMS Alert';
    const options: any = {
      body: payload.body,
      icon: payload.icon || '/logo-rounded.png',
      badge: payload.badge || '/favicon.ico',
      vibrate: [100, 50, 100],
      tag: payload.tag || `markazu-${Date.now()}`,
      data: {
        url: payload.url || '/dashboard',
        ...payload.data,
      },
    };

    try {
      // 1. Preferred: Trigger via Service Worker Registration (works on Android PWA even in background)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, options);
          return true;
        }
      }

      // 2. Fallback: Browser Native Notification Object
      new Notification(title, options);
      return true;
    } catch (err) {
      console.warn('[PushNotificationManager] Failed to trigger notification:', err);
      return false;
    }
  }
}
