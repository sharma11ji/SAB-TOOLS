import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import { updateNotification } from './pushPolicy.js';

// Install our click handler before Firebase's handler. Never navigate an
// existing window: it may contain unsaved measurements.
self.addEventListener('notificationclick', event => {
  if (!event.notification.data?.sabUpdate) return;
  event.stopImmediatePropagation();
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(w => w.url.startsWith(self.registration.scope));
    if (existing) {
      await existing.focus();
      existing.postMessage({ type: 'UPDATE_FROM_NOTIFICATION' });
    } else await self.clients.openWindow(self.registration.scope);
  })());
});
const config = __FIREBASE_PUSH_CONFIG__;
if (config) {
  const messaging = getMessaging(initializeApp(config));
  onBackgroundMessage(messaging, async payload => {
    const notification = updateNotification(payload.data, self.registration.scope);
    if (notification && payload.data.release !== VERSION)
      await self.registration.showNotification(notification.title, notification.options);
  });
}
