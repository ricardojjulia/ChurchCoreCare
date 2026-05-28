import { useEffect } from 'react';
import { api } from './api.js';

const PUSH_ASKED_KEY = 'push-permission-asked';

export function usePushNotifications(user) {
  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(PUSH_ASKED_KEY)) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    // Defer the permission ask by 5 seconds so the user has settled into the app
    const timer = setTimeout(async () => {
      localStorage.setItem(PUSH_ASKED_KEY, '1');

      try {
        const vapidRes = await api.me().catch(() => null); // already authed check
        if (!vapidRes) return;

        // Fetch the VAPID public key
        const keyRes = await fetch('/api/v1/notifications/vapid-public-key', {
          credentials: 'include',
        });
        if (!keyRes.ok) return;
        const { key } = await keyRes.json();
        if (!key) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });

        await api.subscribePush(subscription.toJSON());
      } catch {
        // Push setup failing must never break the app
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
