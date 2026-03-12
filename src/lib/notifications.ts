export async function requestNotificationPermission() {
  const Notification = (window as any).Notification;
  if (!Notification) {
    console.log('This browser does not support desktop notification');
    return 'denied';
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    // Support both promise and callback based requestPermission
    permission = await new Promise((resolve) => {
      const result = Notification.requestPermission((status: NotificationPermission) => {
        resolve(status);
      });
      if (result) {
        result.then(resolve);
      }
    });
  }
  return permission;
}

export async function sendNotification(
  title: string, 
  options?: NotificationOptions, 
  onShowToast?: (title: string, message: string) => void
) {
  // Always show in-app toast as a reliable fallback
  if (onShowToast) {
    onShowToast(title, options?.body || '');
  }

  const Notification = (window as any).Notification;
  if (Notification && Notification.permission === 'granted') {
    // Try to use service worker registration for more reliable notifications
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        registration.showNotification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
        return;
      }
    }
    
    // Fallback to standard Notification
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    } catch (e) {
      console.warn('Failed to show standard notification:', e);
    }
  }
}
