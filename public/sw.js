const VERSION = "__BUILD_VERSION__";
const PRECACHE_FILES = ["__PRECACHE_FILES__"];
const CACHE_PREFIX = "sab-tools-shell-";
const CACHE = CACHE_PREFIX + VERSION;
const appUrl = (path) => new URL(path, self.registration.scope).href;
const INDEX_URL = appUrl("index.html");

async function fillShell(cache) {
  // v11's Cache API ignores the Request.cache flag. A release query bypasses
  // its cached HTML while transitioning; store responses under canonical URLs.
  // Fetch every file first so a failed repair cannot leave a mixed shell.
  const entries = [];
  for (const path of PRECACHE_FILES) {
    const canonical = appUrl(path);
    const fresh = new URL(canonical);
    fresh.searchParams.set("__sab_release", VERSION);
    const response = await fetch(new Request(fresh.href, { cache: "reload" }));
    if (!response.ok) throw new Error("Incomplete app shell: " + path);
    entries.push([canonical, new Response(await response.arrayBuffer(), { status: response.status, headers: response.headers })]);
  }
  await Promise.all(entries.map(([url, response]) => cache.put(url, response)));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Bypass HTTP caches too. A partially downloaded release must never activate.
    await fillShell(cache);
    // One-time bridge from the old cache-first worker. It cannot show the new
    // update UI. Take control without reloading any open measurements; the next
    // navigation gets the new shell. Future updates wait for launch/user consent.
    const keys = await caches.keys();
    const hasModernRelease = keys.some((key) => key !== CACHE && /^sab-tools-shell-[0-9a-f]{16}$/.test(key));
    if (keys.includes("sab-tools-shell-v11") && !hasModernRelease) await self.skipWaiting();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "REPAIR_SHELL") {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(CACHE);
        await fillShell(cache);
        event.source?.postMessage({ type: "SHELL_REPAIRED" });
      } catch { /* Keep the cached shell and user's data on failed/offline repair. */ }
    })());
    return;
  }
  if (event.data?.type !== "ACTIVATE_UPDATE") return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // Automatic launch updates must not disrupt another open app window.
    if (event.data.explicit || windows.length <= 1) await self.skipWaiting();
    else event.source?.postMessage({ type: "UPDATE_NEEDS_CONFIRMATION" });
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Keep the immediately previous release for other already-open tabs.
    const keys = await caches.keys();
    // Retire the migration marker so all subsequent releases wait safely.
    await caches.delete("sab-tools-shell-v11");
    const old = keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE && key !== "sab-tools-shell-v11");
    await Promise.all(old.slice(0, -1).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin ||
      !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Ignore query strings for navigation: ?v= links are no longer needed.
    if (event.request.mode === "navigate") {
      return (await cache.match(INDEX_URL)) || fetch(event.request);
    }
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    // Only the current static shell is cached. Auth/API/customer data is not.
    try {
      const response = await fetch(event.request);
      // A still-open older tab may request a removed hashed chunk. HTTP 404
      // must use its retained release too, not only network exceptions.
      if (!response.ok) {
        const previous = await caches.match(event.request);
        if (previous) return previous;
        if (/\.(js|css)$/.test(url.pathname)) await self.registration.update().catch(() => {});
      }
      return response;
    }
    catch (error) {
      // An older open tab may still refer to its previous hashed bundle offline.
      const previous = await caches.match(event.request);
      if (previous) return previous;
      throw error;
    }
  })());
});
