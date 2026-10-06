import { getMessaging, getToken, deleteToken, isSupported, onMessage } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from './firebase';
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
export const pushConfigured = Boolean(app && db && vapidKey && import.meta.env.VITE_PUSH_OWNER_UID);
let messaging, unsubscribe;
const idKey = 'sab-tools-push-device';
function deviceId() {
  let id = localStorage.getItem(idKey);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(idKey, id); }
  return id;
}
export async function enableUpdatePush(uid, ask = false) {
  if (!pushConfigured || uid !== import.meta.env.VITE_PUSH_OWNER_UID)
    throw new Error('Update notifications are not available on this device yet.');
  if (ask && Notification.permission === 'default') await Notification.requestPermission();
  if (!(await isSupported())) throw new Error('Update notifications are not supported on this browser.');
  if (Notification.permission !== 'granted') throw new Error('Notifications are off. You can allow them in Chrome site settings.');
  messaging ||= getMessaging(app);
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Could not enable notifications. Please try again online.');
  await setDoc(doc(db, 'users', uid, 'pushSubscriptions', deviceId()), {
    token, enabled: true, updatedAt: serverTimestamp(),
  }, { merge: true });
  if (!unsubscribe) unsubscribe = onMessage(messaging, payload => {
    if (payload.data?.type === 'APP_UPDATE') registration.update().catch(() => {});
  });
}
export async function disableUpdatePush(uid) {
  // Remove server delivery first. Failure is visible, not a false "off" state.
  await deleteDoc(doc(db, 'users', uid, 'pushSubscriptions', deviceId()));
  if (messaging) await deleteToken(messaging);
  unsubscribe?.(); unsubscribe = null;
}
