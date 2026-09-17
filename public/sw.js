// "vitae-shell-v4": il nome della cache va cambiato ogni volta che gli asset della shell
// (icone comprese) cambiano davvero — è l'unico modo per cui il service worker si accorge
// di essere diverso e rifà install/activate, ripulendo la cache vecchia. Restare fermi sullo
// stesso nome per checkpoint su checkpoint (come "v1" per molto tempo) è la causa reale già
// trovata dietro "l'icona dell'app è sparita": un'icona rimasta in cache da tanto tempo fa,
// mai più rinfrescata perché il browser non aveva motivo di rieseguire l'installazione.
//
// v4: corretto un elenco rimasto indietro rispetto al codice reale — conteneva ancora
// "/vitaecom" (e le sue sotto-pagine) e "/albero-genealogico", entrambi eliminati da tempo
// (vedi il README). cache.addAll() fallisce IN BLOCCO se anche una sola URL della lista
// risponde con un errore (qui un 404, dato che quelle pagine non esistono più) — quindi da
// quando quelle sezioni sono state rimosse, ogni installazione di questo service worker ha
// silenziosamente fallito l'intero precaricamento della shell (l'errore veniva inghiottito
// dal .catch() qui sotto), senza mai avvisare di nulla: l'app ha continuato a funzionare
// online normalmente, ma senza il vantaggio dell'accesso offline immediato alla prima visita
// di ciascuna sezione, che è lo scopo di questa lista. Aggiornata con le sezioni realmente
// esistenti oggi.
// v5: aggiunta una via di uscita per le chiamate API (vedi il gestore "fetch" più sotto) — le
// stesse istruzioni chiedevano un modo per rilevare un nuovo aggiornamento a comando tramite
// /api/version (vedi app/api/version/route.ts), e quella rotta userebbe questa stessa cache
// se non escludessi esplicitamente /api/: la strategia "cached || network" qui sotto serve
// SEMPRE la cache se esiste, aggiornandola solo per la prossima volta — quindi /api/version
// resterebbe congelato al primo commit mai ricevuto, non rilevando mai un nuovo deploy.
// Controllando questo, trovato lo stesso problema silenzioso già in corso da tempo per
// /api/weather, /api/news e /api/wishlist-price: l'URL di quelle chiamate è quasi sempre
// identico chiamata dopo chiamata (stessa posizione, stesse fonti, stesso articolo), quindi
// anche meteo, notizie e controllo prezzo restavano bloccati al primo valore mai ricevuto in
// quella sessione del service worker, aggiornandosi solo "per la prossima volta" che però
// ripeteva lo stesso problema. Le chiamate API sono dati dinamici per natura — mai da servire
// dalla cache di un service worker pensato per la sola shell dell'app.
const CACHE_NAME = "vitae-shell-v5";
const SHELL_URLS = [
  "/",
  "/wizard",
  "/benvenuto",
  "/profilo",
  "/home",
  "/map",
  "/task",
  "/mondo",
  "/salute",
  "/rapporti",
  "/finanze",
  "/animali",
  "/hobby",
  "/diario",
  "/wishlist",
  "/alimentazione",
  "/attivita-peso",
  "/liste-note",
  "/riepilogo-settimana",
  "/news",
  "/tiber",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  // Ogni URL per conto proprio, non un addAll() unico: addAll() fallisce IN BLOCCO se anche
  // una sola richiesta non va a buon fine (è quello che ha rotto silenziosamente questa
  // cache quando /vitaecom e /albero-genealogico sono state rimosse, vedi la nota sulla
  // versione qui sopra) — con allSettled, una futura pagina rimossa e dimenticata qui fa
  // fallire solo la sua voce, non l'intero precaricamento della shell.
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(SHELL_URLS.map((url) => cache.add(url).catch(() => {})))
      )
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
  // Mai cache-first per le chiamate API — sono dati dinamici (meteo, notizie, prezzo di un
  // articolo, versione dell'app...), non asset della shell. Lasciando qui sotto (return
  // senza chiamare event.respondWith) la richiesta prosegue dritta in rete, come se questo
  // service worker non esistesse — esattamente il comportamento voluto per dati che devono
  // sempre essere freschi. Vedi la nota sul nome della cache qui sopra per come è stato
  // trovato.
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;
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
