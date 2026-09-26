export function registerPWA() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
    });
  }
}
