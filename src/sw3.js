// Offline support for v3. build.py copies this to v3/sw.js and fills in VERSION (a hash of the built page),
// so every deploy gets a new cache name and the old cache is deleted. Edit this file, not v3/sw.js.
// Scope is the v3 folder only (sw.js sits in it), so / and /v2/ are never touched.
// The page (./ and ./index.html) is served from the cache at once and refreshed from the network in the
// background, so a new deploy shows up on the next open. Nothing with a query string is ever stored
// (Telegram can put launch data there): the page is always stored and refreshed under its plain URL.
const CACHE = "fridge-v3-/*VERSION*/";
const PAGE = new URL("./", self.registration.scope).href;
const TG = "https://telegram.org/js/telegram-web-app.js"; // the only other-site file cached (Telegram Mini App script)

const refresh = c => fetch(PAGE, { cache: "no-cache" }).then(r => {
  if (!r.ok || r.type !== "basic" || r.redirected) throw new Error("page fetch failed: " + r.status);
  return c.put(PAGE, r.clone()).then(() => r);
});

self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(refresh)); });
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("fridge-v3-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())));

self.addEventListener("fetch", e => {
  const q = e.request; if (q.method !== "GET") return;
  const u = new URL(q.url), path = u.origin + u.pathname;
  if (path === PAGE || path === PAGE + "index.html") {
    e.respondWith(caches.open(CACHE).then(c => c.match(PAGE).then(hit => {
      const net = refresh(c);
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net.catch(() => fetch(q));
    })));
  } else if (q.url === TG) {
    e.respondWith(caches.open(CACHE).then(c => c.match(TG).then(hit => {
      const net = fetch(q).then(r => { if (r.ok || r.type === "opaque") return c.put(TG, r.clone()).then(() => r); return r; });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    })));
  } // everything else goes straight to the network
});
