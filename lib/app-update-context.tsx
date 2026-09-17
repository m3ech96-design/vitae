"use client";
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";

interface AppUpdateContextValue {
  /** Un nuovo service worker ha già preso il controllo, oppure un controllo manuale ha
   * trovato un commit diverso da quello con cui l'app è partita — in entrambi i casi basta
   * ricaricare per vedere la versione nuova. */
  updateReady: boolean;
  /** Un controllo manuale (pulsante "Cerca aggiornamenti") è in corso. */
  checking: boolean;
  /** L'ultimo controllo manuale non ha trovato nulla di nuovo — pensato per un feedback
   * rapido e discreto vicino al pulsante, si azzera da solo dopo pochi secondi. */
  upToDateNotice: boolean;
  /** Controlla subito se Vercel ha pubblicato una versione più recente — sia lato service
   * worker (un file sw.js diverso) sia lato build (un commit diverso via /api/version,
   * indipendente da sw.js: vedi la nota lì). */
  checkNow: () => Promise<void>;
  applyUpdate: () => void;
  dismiss: () => void;
}

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

/**
 * Corretto secondo le istruzioni: prima l'unico segnale di aggiornamento era il service
 * worker stesso (`controllerchange`, scatta solo se sw.js è byte-diverso da prima) — la
 * maggioranza dei checkpoint non tocca affatto sw.js, quindi per quei checkpoint l'app non
 * avrebbe mai rivelato che una versione più recente era stata pubblicata su Vercel, mancando
 * l'obiettivo originale ("un avviso ad ogni nuovo checkpoint"). Aggiunto qui un secondo
 * segnale via /api/version (il commit che Vercel imposta ad ogni deploy, qualunque cosa sia
 * cambiata) e un modo per controllarlo A COMANDO, non solo passivamente al ritorno in
 * primo piano — da qui usa il pulsante in Home, tramite `checkNow`.
 */
export function AppUpdateProvider({ children }: { children: React.ReactNode }) {
  const [updateReady, setUpdateReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [upToDateNotice, setUpToDateNotice] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  // Il commit con cui questa scheda è partita — non lo stato React, perché non deve mai
  // causare un nuovo render da solo: cambia idealmente una volta sola nella vita di questa
  // scheda, quando checkNow trova qualcosa di diverso, e a quel punto è updateReady (già
  // React state) a far comparire il banner.
  const knownCommitRef = useRef<string | null>(null);

  const fetchCommit = useCallback(async (): Promise<string | null> => {
    try {
      // cache: "no-store" oltre all'esclusione già fatta in sw.js (vedi lì) — doppia
      // sicurezza contro qualunque cache intermedia, del browser stesso stavolta, non solo
      // del service worker.
      const res = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data?.commit === "string" ? data.commit : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchCommit().then((c) => {
      knownCommitRef.current = c;
    });

    if (!("serviceWorker" in navigator)) return;
    // Se la pagina è già controllata da un service worker quando questo effetto parte, un
    // cambio di controller più avanti è un vero aggiornamento da segnalare. Alla primissima
    // registrazione in assoluto (nessun controller ancora) lo stesso evento può scattare per
    // la sola installazione iniziale, che non è un aggiornamento — niente banner in quel caso.
    const hadControllerAlready = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registrationRef.current = reg;
        reg.update().catch(() => {});
      })
      .catch(() => {});

    const onControllerChange = () => {
      if (hadControllerAlready) setUpdateReady(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const onVisible = () => {
      if (document.visibilityState === "visible") registrationRef.current?.update().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [fetchCommit]);

  const checkNow = useCallback(async () => {
    setChecking(true);
    setUpToDateNotice(false);
    try {
      // Chiede anche al service worker di ricontrollare sw.js in parallelo — se qualcosa
      // cambia lì, arriva comunque il consueto evento controllerchange sopra; questo
      // controllo via commit copre invece i checkpoint che non toccano sw.js.
      registrationRef.current?.update().catch(() => {});
      const commit = await fetchCommit();
      if (commit && knownCommitRef.current && commit !== knownCommitRef.current) {
        knownCommitRef.current = commit;
        setUpdateReady(true);
      } else {
        if (commit) knownCommitRef.current = commit;
        setUpToDateNotice(true);
        setTimeout(() => setUpToDateNotice(false), 3000);
      }
    } finally {
      setChecking(false);
    }
  }, [fetchCommit]);

  const applyUpdate = useCallback(() => window.location.reload(), []);
  const dismiss = useCallback(() => setUpdateReady(false), []);

  return (
    <AppUpdateContext.Provider value={{ updateReady, checking, upToDateNotice, checkNow, applyUpdate, dismiss }}>
      {children}
    </AppUpdateContext.Provider>
  );
}

export function useAppUpdate(): AppUpdateContextValue {
  const ctx = useContext(AppUpdateContext);
  if (!ctx) throw new Error("useAppUpdate va usato dentro un AppUpdateProvider");
  return ctx;
}
