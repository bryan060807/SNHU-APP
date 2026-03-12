/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Requests permission from the user to show desktop notifications.
 * Streamlined to use modern Promise-based API.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn('System: This browser does not support desktop notifications.');
    return 'denied';
  }

  let permission = Notification.permission;
  
  if (permission === 'default') {
    try {
      // Modern browsers return a promise
      permission = await Notification.requestPermission();
    } catch (error) {
      // Fallback for legacy callback-based implementations
      permission = await new Promise((resolve) => {
        Notification.requestPermission((status) => resolve(status));
      });
    }
  }
  
  return permission;
}

/**
 * Sends a notification via the browser's Notification API.
 * Prioritizes Service Worker for background reliability with a standard fallback.
 */
export async function sendNotification(
  title: string, 
  options?: NotificationOptions, 
  onShowToast?: (title: string, message: string) => void
) {
  // Always trigger the in-app Toast for immediate feedback within the UI
  if (onShowToast) {
    onShowToast(title, options?.body || '');
  }

  if (!("Notification" in window) || Notification.permission !== 'granted') {
    return;
  }

  // Attempt to use Service Worker registration for persistent notifications
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        registration.showNotification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          silent: false,
          ...options,
        });
        return;
      }
    } catch (swError) {
      console.warn('Service Worker notification failed, falling back to standard API:', swError);
    }
  }
  
  // Standard Web Notification fallback
  try {
    new Notification(title, {
      icon: '/favicon.ico',
      ...options,
    });
  } catch (e) {
    console.warn('Failed to display standard browser notification:', e);
  }
}