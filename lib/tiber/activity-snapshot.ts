import { TiberExecutionContext, ctxField } from "./tool-types";
import { Hobby } from "@/lib/hobby-types";
import { DiaryEntry } from "@/lib/diary-types";
import { WishlistItem } from "@/lib/wishlist-types";
import { Place } from "@/lib/types";

/** Prefisso "tiber-runtime:", non "vitae:" — deliberatamente fuori dal backup (lib/backup.ts,
 * che salva tutto ciò che inizia per "vitae:"): sono segnapunti tecnici, non contenuto vero,
 * e ripristinarli da un vecchio backup su un momento o dispositivo diverso confonderebbe più
 * che aiutare (es. un "ultimo luogo noto" di una sessione passata che non corrisponde più a
 * dove ci si trova davvero ora). Ultimo luogo salvato in cui risultava trovarsi l'utente — non
 * un confronto temporale come gli altri moduli (la presenza in un luogo è uno stato che dura,
 * non ha una "data di creazione"): l'evento è il CAMBIAMENTO, l'arrivo, non la permanenza
 * continua. */
const LAST_PLACE_KEY = "tiber-runtime:last-place-id";
/** Chiave del pasto già segnalato oggi ("2026-09-18:pranzo") — evita di richiedere la
 * stessa cosa più volte durante la stessa finestra pasto, dato che il controllo gira ogni
 * minuto (vedi TiberProactiveScheduler.tsx). */
const LAST_MEAL_KEY = "tiber-runtime:last-meal-nudge";

function currentMealWindow(): "pranzo" | "cena" | null {
  const h = new Date().getHours();
  if (h >= 12 && h < 14) return "pranzo";
  if (h >= 19 && h < 21) return "cena";
  return null;
}

/**
 * Costruisce un breve elenco di "cosa è successo di recente" — letto direttamente dai
 * context (zero chiamate a Gemini, zero costo) e passato come base di partenza a un momento
 * di riflessione spontanea (vedi triggerReflection in context.tsx). Senza questo, Tiber
 * dovrebbe chiamare a tappeto una dozzina di tool di lettura solo per "guardarsi intorno" —
 * esattamente il genere di spreco che il vincolo sul tetto di Gemini vuole evitare. Tiber
 * resta comunque libero di approfondire con i propri tool (es. cercare notizie su un libro)
 * quando qualcosa qui dentro lo incuriosisce davvero — questo è solo il primo sguardo.
 *
 * Copertura onesta, non finta-completa: solo i moduli con un segnale affidabile per
 * distinguere "successo ora" da "successo tempo fa" sono qui dentro (Stato d'animo, Hobby,
 * Diario, Wishlist — un campo `createdAt` pulito — e Mappa/Luoghi, dove il segnale è invece
 * un cambiamento di stato osservabile: l'arrivo in un luogo diverso da quello di prima, l'ora
 * di un pasto mentre si è fuori casa). Gli altri moduli (Finanze, Salute, Animali, Attività,
 * Task, Note...) non hanno un `createdAt` pulito su ogni voce nel modello dati attuale —
 * includerli avrebbe richiesto indovinare la recenza dalla sola data dell'evento (spesso
 * diversa dal giorno in cui è stata scritta), un segnale debole e rischioso di essere
 * fuorviante. Restano comunque interamente consultabili: Tiber può interrogarli con i propri
 * tool in qualunque momento, anche fuori da un momento di riflessione — semplicemente non
 * entrano in questo riepilogo automatico. Estendibile in futuro aggiungendo un vero
 * `updatedAt` a quei moduli, se servisse davvero.
 *
 * Restituisce `null` quando non c'è nulla di nuovo — è proprio questo il segnale che rende
 * possibile la terza strada scelta esplicitamente al posto di un orologio a intervalli
 * casuali (vedi triggerReflection in context.tsx e TiberProactiveScheduler.tsx): l'occasione
 * di interpellare Tiber nasce da un evento vero rilevato qui, non da un timer scollegato dai
 * fatti — se questa funzione non trova nulla, Gemini non viene proprio chiamato, a costo
 * zero, invece di essere comunque interpellato "per dovere" a ogni giro.
 */
export function buildActivitySnapshot(ctx: TiberExecutionContext, sinceIso: string, disabledModules: string[]): string | null {
  const enabled = (id: string) => !disabledModules.includes(id);
  const lines: string[] = [];
  const timeOf = (iso: string) => iso.slice(11, 16);

  if (enabled("mood")) {
    const moodModule = ctxField<{
      mood: { activeMood: { moodId: string; startedAt: string } | null; allMoods: { id: string; label: string }[] };
      needs: { needs: { id: string; label: string; startedAt: string }[] };
    }>(ctx, "moodModule");
    const active = moodModule.mood.activeMood;
    if (active && active.startedAt >= sinceIso) {
      const label = moodModule.mood.allMoods.find((m) => m.id === active.moodId)?.label ?? active.moodId;
      lines.push(`Stato d'animo impostato su "${label}" alle ${timeOf(active.startedAt)}.`);
    }
    for (const n of moodModule.needs.needs.filter((n) => n.startedAt >= sinceIso)) {
      lines.push(`Nuovo bisogno settimanale: "${n.label}".`);
    }
  }

  if (enabled("hobby")) {
    const { hobbies } = ctxField<{ hobbies: Hobby[] }>(ctx, "hobby");
    for (const h of hobbies) {
      for (const b of h.blocks) {
        if (b.kind === "checklist") {
          for (const i of b.items.filter((i) => i.createdAt >= sinceIso)) lines.push(`Hobby "${h.name}" → Checklist: aggiunta "${i.title}".`);
        } else if (b.kind === "inventario") {
          for (const i of b.items.filter((i) => i.createdAt >= sinceIso)) lines.push(`Hobby "${h.name}" → Inventario: aggiunto "${i.name}".`);
        } else if (b.kind === "progetti") {
          for (const p of b.projects.filter((p) => p.createdAt >= sinceIso)) lines.push(`Hobby "${h.name}" → Progetti: aggiunto "${p.name}" (${p.status}).`);
        } else if (b.kind === "libreria") {
          for (const i of b.items.filter((i) => i.createdAt >= sinceIso)) {
            const bits = [i.status, i.rating ? `voto ${i.rating}/5` : null, i.review ? "con recensione" : null].filter(Boolean).join(", ");
            lines.push(`Hobby "${h.name}" → Libreria: aggiunto "${i.title}" (${bits}).`);
          }
        } else if (b.kind === "partite") {
          for (const m of b.matches.filter((m) => m.createdAt >= sinceIso)) lines.push(`Hobby "${h.name}" → Partite: registrata una partita (${m.result}).`);
        }
      }
    }
  }

  if (enabled("diary")) {
    const { entries } = ctxField<{ entries: DiaryEntry[] }>(ctx, "diary");
    const sinceStamp = sinceIso.slice(0, 16);
    for (const e of entries.filter((e) => `${e.date}T${e.time}` >= sinceStamp)) {
      lines.push(`Diario: nuova voce ("${e.text.slice(0, 60)}${e.text.length > 60 ? "…" : ""}").`);
    }
  }

  if (enabled("wishlist")) {
    const { items } = ctxField<{ items: WishlistItem[] }>(ctx, "wishlist");
    for (const i of items.filter((i) => i.createdAt >= sinceIso)) lines.push(`Wishlist: aggiunto "${i.name}".`);
  }

  // Riusa il rilevamento di posizione già esistente per il pallino "Sei Qui"/Casa-Fuori casa
  // (household-context.tsx) — nessun tracciamento indipendente aperto qui, stesso interruttore
  // già scelto dall'utente in Mappa. Raggruppato sotto lo stesso permesso "places" (Mappa)
  // delle impostazioni Tiber, non uno separato: è la stessa scheda dell'app, concettualmente.
  if (enabled("places")) {
    const location = ctxField<{
      currentPlaceIcon: Place | null;
      userIsAway: boolean;
      livePosition: { lat: number; lng: number } | null;
      trackingEnabled: boolean;
    }>(ctx, "location");

    if (location.trackingEnabled) {
      const coordsNote = location.livePosition
        ? ` Coordinate attuali: ${location.livePosition.lat.toFixed(4)}, ${location.livePosition.lng.toFixed(4)} — puoi usarle per cercare sul web cosa c'è nei dintorni.`
        : "";

      // Arrivo in un luogo salvato diverso da casa — un evento vero (il cambiamento),
      // confrontato con l'ultimo luogo noto invece che con sinceIso.
      let lastPlaceId: string | null = null;
      try {
        lastPlaceId = window.localStorage.getItem(LAST_PLACE_KEY);
      } catch {
        // ignorato
      }
      if (location.currentPlaceIcon && !location.currentPlaceIcon.isPrimaryHome && location.currentPlaceIcon.id !== lastPlaceId) {
        lines.push(`Sei arrivato a "${location.currentPlaceIcon.name}" (${location.currentPlaceIcon.type}), un luogo salvato diverso da casa.${coordsNote}`);
        try {
          window.localStorage.setItem(LAST_PLACE_KEY, location.currentPlaceIcon.id);
        } catch {
          // ignorato
        }
      } else if (!location.currentPlaceIcon && lastPlaceId) {
        try {
          window.localStorage.removeItem(LAST_PLACE_KEY);
        } catch {
          // ignorato
        }
      }

      // Ora dei pasti mentre si è fuori casa — un evento quotidiano, segnalato al più una
      // volta per pasto per giorno anche se il controllo gira ogni minuto.
      const meal = currentMealWindow();
      if (meal && location.userIsAway) {
        const mealKey = `${new Date().toISOString().slice(0, 10)}:${meal}`;
        let lastMealKey: string | null = null;
        try {
          lastMealKey = window.localStorage.getItem(LAST_MEAL_KEY);
        } catch {
          // ignorato
        }
        if (lastMealKey !== mealKey) {
          lines.push(`È ora di ${meal} e sei fuori casa.${coordsNote} Se ti va, potresti cercare sul web un posto ben valutato nelle vicinanze dove mangiare.`);
          try {
            window.localStorage.setItem(LAST_MEAL_KEY, mealKey);
          } catch {
            // ignorato
          }
        }
      }
    }
  }

  return lines.length > 0 ? lines.join("\n") : null;
}
