// "vitae-shell-v2": il nome della cache va cambiato ogni volta che gli asset della shell
// (icone comprese) cambiano davvero — è l'unico modo per cui il service worker si accorge
// di essere diverso e rifà install/activate, ripulendo la cache vecchia. Restare fermi sullo
// stesso nome per checkpoint su checkpoint (come "v1" per molto tempo) è la causa reale già
// trovata dietro "l'icona dell'app è sparita": un'icona rimasta in cache da tanto tempo fa,
// mai più rinfrescata perché il browser non aveva motivo di rieseguire l'installazione.
const CACHE_NAME = "vitae-shell-v2";
const SHELL_URLS = ["/", "/wizard", "/profilo", "/home", "/map", "/task", "/mondo", "/salute", "/rapporti", "/finanze", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Base pronta per le notifiche push: l'invio effettivo richiede un backend
// (VAPID + servizio di invio) che verrà collegato in una fase successiva.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Vitae", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    })
  );
});
