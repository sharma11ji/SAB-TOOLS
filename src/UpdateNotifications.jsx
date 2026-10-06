import React, { useEffect, useState } from 'react';
import { enableUpdatePush, disableUpdatePush, pushConfigured } from './pushNotifications';
import { notificationOffer } from './pushPolicy';
export default function UpdateNotifications({ user, active }) {
  const [used, setUsed] = useState(() => localStorage.getItem('sab-tools-used') === '1');
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('sab-tools-push-dismissed') === '1');
  const [enabled, setEnabled] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const owner = user?.uid === import.meta.env.VITE_PUSH_OWNER_UID;
  useEffect(() => { if (!active) { localStorage.setItem('sab-tools-used', '1'); setUsed(true); } }, [active]);
  useEffect(() => {
    let live = true;
    if (owner && pushConfigured && globalThis.Notification?.permission === 'granted' && localStorage.getItem('sab-tools-push-opted') === '1')
      enableUpdatePush(user.uid).then(() => { if (live) setEnabled(true); }).catch(() => { if(live) setError('Could not refresh update notifications. Try again online.'); });
    return () => { live = false; };
  }, [owner, user?.uid]);
  if (!pushConfigured || !owner || !used || !active || !globalThis.Notification) return null;
  const offer = notificationOffer({ configured: pushConfigured, owner, used, dismissed, permission: Notification.permission });
  async function change() {
    setBusy(true); setError('');
    try {
      if (enabled) { await disableUpdatePush(user.uid); localStorage.removeItem('sab-tools-push-opted'); setEnabled(false); }
      else { await enableUpdatePush(user.uid, true); localStorage.setItem('sab-tools-push-opted','1'); setEnabled(true); }
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  return <section className="push-settings" aria-label="Update notifications">
    <strong>Update notifications</strong>
    <p>{enabled ? 'On for this device. You can turn them off anytime.' : offer ? 'Get a phone notification when a new version is ready, even when the app is closed.' : 'Enable update notifications for this device. If blocked, allow notifications in Chrome site settings.'}</p>
    <button type="button" disabled={busy} onClick={change}>{busy ? 'Please wait...' : enabled ? 'Turn off' : 'Enable notifications'}</button>
    {offer && <button type="button" onClick={() => { localStorage.setItem('sab-tools-push-dismissed','1'); setDismissed(true); }}>Not now</button>}
    {error && <p role="status">{error}</p>}
  </section>;
}
