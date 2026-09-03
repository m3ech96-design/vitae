"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Globe, DoorOpen, X } from "lucide-react";
import { Place } from "@/lib/types";
import { PLACE_TYPE_META } from "@/lib/places-meta";

/** Stesso azzurro del ring "world" di AuraAvatar (vedi lib/tailwind aura-sky) — così chi è
 * "in giro" resta coerente tra il bordo dell'avatar (quando presente) e questo badge. */
const WORLD_COLOR = "#5EC8FF";

/** Stesso caldo neutro già usato altrove nell'app per segnare "un'altra identità, non la
 * tua" (vedi il badge "Esempio" e il glow degli account Vitaecom in famiglia) — qui indica
 * "una casa, ma non la tua": stesso linguaggio di colore, significato coerente. */
const OTHER_HOME_COLOR = "#B79A6B";

/**
 * Piccola finestra col nome del luogo, aperta toccando il badge. Esce sempre con un portal
 * su `document.body` — stesso bug reale già corretto altrove nell'app (vedi ConfirmDialog):
 * un discendente `fixed` dentro il `GlassCard` della card Famiglia (che applica sempre
 * `overflow-hidden` per i propri angoli arrotondati) resterebbe schiacciato dentro il suo
 * bordo invece che relativo al viewport, specialmente su iOS Safari.
 */
function PlaceNamePopover({ place, onClose }: { place: Place; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const meta = PLACE_TYPE_META[place.type];
  const isOtherHome = place.type === "casa" && !place.isPrimaryHome;
  const Icon = isOtherHome ? DoorOpen : meta.icon;
  const color = isOtherHome ? OTHER_HOME_COLOR : meta.color;
  // "Come rinominato" — solo se il nome è stato cambiato da quello con cui il Luogo è nato
  // (vedi lib/places-context.tsx, `originalName` non cambia più dopo la creazione) si mostra
  // quel nome; altrimenti, invece del nome generico, l'indirizzo vero e proprio.
  const renamed = place.name !== place.originalName;
  const displayText = renamed ? place.name : place.address;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-void-950/85 p-6 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex w-full max-w-xs items-center gap-3 rounded-xl3 p-5"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}aa` }}
        >
          <Icon size={18} className="text-void-950" strokeWidth={2.6} />
        </span>
        <p className="min-w-0 flex-1 truncate font-display text-sm text-ink-100">{displayText}</p>
        <button onClick={onClose} className="focus-ring shrink-0 text-ink-600 hover:text-ink-200" aria-label="Chiudi">
          <X size={16} />
        </button>
      </motion.div>
    </div>,
    document.body
  );
}

/**
 * Corretto secondo le istruzioni: prima questo badge spariva del tutto quando la persona
 * era fuori casa ma in un luogo non registrato tra i Luoghi (o senza alcun luogo noto) —
 * lasciando l'avatar senza alcun indizio su dove si trovasse. Ora, in quel caso, mostra
 * un mondo al posto dell'icona del tipo di luogo: stesso posto, stesso stile, significato
 * diverso ("sei in giro, non in un luogo salvato").
 *
 * Corretto secondo le istruzioni: un Luogo di tipo Casa non è sempre LA propria casa — può
 * essere quella di un familiare o di conoscenti (qualunque Luogo Casa che non sia quello
 * collegato alla propria Famiglia, riconoscibile da `isPrimaryHome`). Prima entrambi
 * mostravano la stessa icona a forma di casa viola, indistinguibili; ora una porta aperta
 * in un colore diverso segna "sei ospite altrove", riservando casa piena e viola alla
 * propria vera casa.
 *
 * Corretto secondo le istruzioni: prima l'icona era solo indicativa, senza alcuna reazione
 * al tocco. Ora — quando rappresenta davvero un Luogo, non il mondo (lì non c'è nulla da
 * mostrare: nessun Luogo noto) — è un bottone vero che apre la piccola finestra sopra.
 * `stopPropagation` sul click: sta sempre dentro una riga/avatar già cliccabile per aprire
 * altro (la scheda della persona), e toccare il badge non deve aprire anche quella.
 */
export function PlaceIconBadge({ place, size = 72, showWorldFallback = false }: { place: Place | null; size?: number; showWorldFallback?: boolean }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  if (!place && !showWorldFallback) return null;
  const badgeSize = Math.max(18, Math.round(size * 0.32));

  if (!place) {
    return (
      <span
        className="absolute z-10 flex items-center justify-center rounded-full border-2 border-void-950"
        style={{
          top: -2,
          right: -2,
          width: badgeSize,
          height: badgeSize,
          background: WORLD_COLOR,
          boxShadow: `0 0 8px ${WORLD_COLOR}aa`,
        }}
        title="In giro"
      >
        <Globe size={Math.round(badgeSize * 0.56)} className="text-void-950" strokeWidth={2.6} />
      </span>
    );
  }

  const isOtherHome = place.type === "casa" && !place.isPrimaryHome;
  const meta = PLACE_TYPE_META[place.type];
  const Icon = isOtherHome ? DoorOpen : meta.icon;
  const color = isOtherHome ? OTHER_HOME_COLOR : meta.color;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPopoverOpen(true);
        }}
        className="focus-ring absolute z-10 flex appearance-none items-center justify-center rounded-full border-2 border-void-950 p-0"
        style={{
          top: -2,
          right: -2,
          width: badgeSize,
          height: badgeSize,
          background: color,
          boxShadow: `0 0 8px ${color}aa`,
        }}
        title={isOtherHome ? `Sei a casa di ${place.name}` : `Sei a ${place.name}`}
      >
        <Icon size={Math.round(badgeSize * 0.56)} className="text-void-950" strokeWidth={2.6} />
      </button>
      {popoverOpen && <PlaceNamePopover place={place} onClose={() => setPopoverOpen(false)} />}
    </>
  );
}
