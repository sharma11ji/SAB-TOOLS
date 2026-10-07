export const SPLASH_DAY_KEY = 'sab-tools-logo-splash-day';
export function localDay(date = new Date()) {
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
// Claim once at cold boot, not on route changes or React effect re-runs.
export function claimLaunchSplash(storage, date = new Date(), reducedMotion = false) {
 if (reducedMotion) return false;
 try {
  const day = localDay(date);
  if (storage.getItem(SPLASH_DAY_KEY) === day) return false;
  storage.setItem(SPLASH_DAY_KEY, day);
  return true;
 } catch { return false; } // An unavailable repeat guard must not delay every launch.
}
