// Runs inline before the hashed app bundle, so a missing bundle cannot disable it.
export function bootRecovery() {
  const root = document.getElementById('root');
  if (!root || !('serviceWorker' in navigator)) return;
  const base = new URL('./', location.href);
  let booted = false, recovering = false, registration;
  const key = 'sab-tools-boot-retry';
  const status = root.querySelector('[data-boot-status]');
  const retry = root.querySelector('button');
  const observer = new MutationObserver(() => {
    if (!root.querySelector('[data-sab-boot]') && root.childElementCount) {
      booted = true;
      observer.disconnect();
      try { sessionStorage.removeItem(key); } catch {}
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  const reload = () => {
    if (booted) return;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { return; } // No storage means no safe reload-loop guard.
    location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recovering && !booted) reload();
  });
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SHELL_REPAIRED' && recovering && !booted) reload();
  });
  const activate = () => {
    if (recovering && !booted && registration?.waiting)
      registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE', explicit: false });
  };
  // Register even if the main module fails to load or cannot evaluate.
  const ready = navigator.serviceWorker.register(new URL('sw.js', base), { updateViaCache: 'none' })
    .then((reg) => {
      registration = reg;
      reg.addEventListener('updatefound', () => {
        reg.installing?.addEventListener('statechange', activate);
      });
      activate();
      return reg;
    }).catch(() => null);
  async function recover() {
    if (booted || recovering) return;
    recovering = true;
    if (status) status.textContent = 'Checking for an app update...';
    if (retry) retry.hidden = false;
    const reg = await ready;
    if (booted) return;
    try { await reg?.update(); } catch {}
    activate();
    navigator.serviceWorker.controller?.postMessage({ type: 'REPAIR_SHELL' });
    if (status && !booted) status.textContent = 'App could not start. Connect to the internet, then tap Retry. Your saved data has not been cleared.';
  }
  retry?.addEventListener('click', () => {
    try { sessionStorage.removeItem(key); } catch {}
    location.reload();
  });
  window.addEventListener('error', (event) => {
    if (event.target?.tagName === 'SCRIPT' || event.target === window) recover();
  }, true);
  window.addEventListener('unhandledrejection', recover);
  setTimeout(recover, 12000);
}
