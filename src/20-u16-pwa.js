// No reload after interaction or on a background/resume check. Unsaved work stays put.
export function registerPWA({ win = window, nav = navigator, doc = document,
  base = import.meta.env.BASE_URL, now = Date.now } = {}) {
  if (!("serviceWorker" in nav)) return;
  const started = now();
  let interacted = false, activating = false, explicitActivation = false, activeNeedsReload = false;
  let reloaded = false, registration, prompt;
  const markInteraction = () => { interacted = true; };
  for (const type of ["pointerdown", "keydown", "input", "change"])
    doc.addEventListener(type, markInteraction, { capture: true, once: true });

  const showPrompt = () => {
    if (prompt || (!registration?.waiting && !activeNeedsReload)) return;
    activating = false;
    prompt = doc.createElement("aside");
    prompt.className = "pwa-update";
    prompt.setAttribute("role", "status");
    const text = doc.createElement("span");
    text.textContent = "New version available";
    const button = doc.createElement("button");
    button.type = "button";
    button.textContent = "Update";
    button.addEventListener("click", () => {
      if (!win.confirm("Update now? Save your work first. Unsaved entries will be lost.")) return;
      if (activeNeedsReload) win.location.reload();
      else activate(true);
    });
    prompt.append(text, button);
    doc.body.append(prompt);
  };
  const activate = (explicit) => {
    if (!registration?.waiting) return;
    activating = true;
    explicitActivation = explicit;
    registration.waiting.postMessage({ type: "ACTIVATE_UPDATE", explicit });
  };
  const offerUpdate = () => {
    if (!registration?.waiting) return;
    if (!interacted && now() - started < 10000 && doc.visibilityState === "visible") activate(false);
    else showPrompt();
  };
  nav.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "UPDATE_NEEDS_CONFIRMATION") showPrompt();
    if (event.data?.type === "UPDATE_FROM_NOTIFICATION") {
      interacted = true; // Notification must not erase an existing form.
      check();
      offerUpdate();
    }
  });
  nav.serviceWorker.addEventListener("controllerchange", () => {
    if (activating && !reloaded) {
      if (explicitActivation || (!interacted && now() - started < 10000 && doc.visibilityState === "visible")) {
        reloaded = true;
        win.location.reload();
      } else {
        activeNeedsReload = true;
        showPrompt();
      }
    }
  });
  const check = () => registration?.update().catch(() => {});
  const start = async () => {
    try {
      registration = await nav.serviceWorker.register(`${base}sw.js`, { updateViaCache: "none" });
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && nav.serviceWorker.controller) offerUpdate();
        });
      });
      offerUpdate();
      await check();
    } catch { /* Offline launch still works from the last complete shell. */ }
  };
  if (doc.readyState === "complete") start();
  else win.addEventListener("load", start, { once: true });
  win.addEventListener("online", () => { interacted = true; check(); });
  doc.addEventListener("visibilitychange", () => {
    if (doc.visibilityState === "visible") { interacted = true; check(); }
  });
}
