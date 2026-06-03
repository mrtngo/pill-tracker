import { getLocalDateString } from '../hooks/usePillData';

export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

export const getNotificationPermissionState = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

// Fire a notification using the Service Worker registration
export const sendNotification = async (title, body) => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported on this device/browser.');
    return false;
  }

  const permission = Notification.permission;
  if (permission !== 'granted') {
    console.warn('Notification permission not granted.');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      body: body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'aegis-pill-reminder',
      renotify: true,
      data: {
        url: window.location.origin
      }
    });
    return true;
  } catch (err) {
    console.error('Failed to show notification via service worker, falling back to standard notification:', err);
    try {
      new Notification(title, { body, icon: '/icon-192.png' });
      return true;
    } catch (e) {
      console.error('Fallback notification failed:', e);
      return false;
    }
  }
};

// Sets up a timer that triggers at the specified target time
// targetTime format: "HH:MM" (e.g. "21:00")
let reminderIntervalId = null;
export const startReminderCheck = (reminderTimeStr, logs, pillName) => {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
  }

  const check = () => {
    const now = new Date();
    const todayStr = getLocalDateString(now);

    // Format current hours and minutes
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    // If current time is equal to or past the scheduled reminder time
    if (currentTimeStr >= reminderTimeStr) {
      const isTaken = logs[todayStr]?.taken;
      const lastNotifiedDate = localStorage.getItem('aegis_last_notified_date');

      if (!isTaken && lastNotifiedDate !== todayStr) {
        sendNotification(
          `¡Hora de tu ${pillName}!`,
          `No olvides registrar tu dosis de esta noche. Toca para registrar.`
        );
        localStorage.setItem('aegis_last_notified_date', todayStr);
      }
    }
  };

  // Run check immediately and then every minute
  check();
  reminderIntervalId = setInterval(check, 60 * 1000);

  // Add event listeners to check immediately when tab becomes visible or focused
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      check();
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', check);

  return () => {
    if (reminderIntervalId) {
      clearInterval(reminderIntervalId);
    }
    window.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', check);
  };
};
