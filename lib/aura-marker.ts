import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Le icone qui sotto vivono in stringhe HTML iniettate via Leaflet `divIcon`, fuori
 * dall'albero React: un refuso in una classe Tailwind non dà un errore a compile-time,
 * semplicemente quel pezzo smette di funzionare in silenzio — esattamente il tipo di bug
 * già capitato una volta in questo progetto (un bagliore perso per tutti gli animali dopo
 * una riscrittura). Per questo le classi condivise tra le icone sono costanti scritte una
 * sola volta qui, non ricopiate a mano in ogni funzione.
 */
const ICON_WRAPPER_CLASS = "relative flex items-center justify-center";
const PULSE_CLASS = "animate-pulseSoft";

export function createAuraDivIcon(
  color: string,
  opts?: { shape?: "circle" | "diamond"; size?: number; active?: boolean; icon?: LucideIcon }
) {
  const size = opts?.size ?? 34;
  const shape = opts?.shape ?? "circle";
  const active = opts?.active ?? false;
  const shapeClass = shape === "diamond" ? "rounded-md rotate-45" : "rounded-full";
  const inner = Math.round(size * 0.56);

  // Corretto secondo le istruzioni: prima il marker era solo una forma piena (un cerchio o
  // un rombo colorato, senza alcuna icona) — ora ci disegna dentro la stessa icona colorata
  // già usata per elencare i luoghi (vedi PLACE_TYPE_META), bianca su sfondo colorato, per
  // essere riconoscibile a colpo d'occhio come lo è nell'elenco. Effetti e animazioni
  // (alone che pulsa, anello "sei qui") restati identici, solo il centro non è più vuoto.
  // Nel rombo l'icona viene contro-ruotata di -45° per restare dritta, non inclinata come
  // il contenitore che la ospita.
  const iconMarkup = opts?.icon
    ? renderToStaticMarkup(createElement(opts.icon, { size: Math.round(inner * 0.58), color: "#fff", strokeWidth: 2.25 }))
    : "";
  const iconWrapperStyle = shape === "diamond" ? "transform:rotate(-45deg);" : "";

  const html = `
    <div class="${ICON_WRAPPER_CLASS}" style="width:${size}px;height:${size}px;">
      <span class="absolute inset-[-7px] ${shapeClass} blur-md ${PULSE_CLASS}" style="background:${color};opacity:${active ? 0.6 : 0.32};"></span>
      <span class="relative flex items-center justify-center ${shapeClass} border border-white/60" style="width:${inner}px;height:${inner}px;background:linear-gradient(135deg, ${color}, ${color}); box-shadow:0 0 14px ${color}aa, inset 0 1px 2px rgba(255,255,255,0.45);">
        <span style="${iconWrapperStyle}">${iconMarkup}</span>
      </span>
      ${active ? `<span class="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-void-950" style="background:#00E5C7;"></span>` : ""}
    </div>
  `;

  return L.divIcon({
    html,
    className: "aura-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Icona del cluster (più luoghi vicini raggruppati, vedi react-leaflet-cluster in
 * LeafletMap.tsx) — stesso linguaggio visivo aura degli altri marker invece del cerchio
 * verde/giallo/rosso di default della libreria, che stonerebbe con l'estetica dark/glow del
 * resto dell'app. Il numero al centro è l'unica informazione che serve: quanti luoghi
 * contiene, non quali — si scopre aprendo lo zoom.
 */
export function createClusterDivIcon(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount();
  const size = count >= 10 ? 44 : 36;
  const html = `
    <div class="${ICON_WRAPPER_CLASS}" style="width:${size}px;height:${size}px;">
      <span class="absolute inset-[-7px] rounded-full blur-md ${PULSE_CLASS}" style="background:#7C5CFF;opacity:0.4;"></span>
      <span class="relative flex items-center justify-center rounded-full border border-white/60 font-sans text-white" style="width:${size}px;height:${size}px;background:linear-gradient(135deg, #7C5CFF, #5B3FE0); box-shadow:0 0 16px #7C5CFFaa, inset 0 1px 2px rgba(255,255,255,0.45); font-size:${count >= 10 ? 15 : 13}px; font-weight:600;">
        ${count}
      </span>
    </div>
  `;
  return L.divIcon({ html, className: "aura-marker", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

/**
 * Pallino "Sei Qui": colore e stile deliberatamente diversi dai marker Aura dei Luoghi
 * (nessun tipo di Luogo usa questo blu), per non essere scambiato per un Luogo registrato.
 */
export function createUserLocationDivIcon() {
  const color = "#4F8CFF";
  const html = `
    <div class="${ICON_WRAPPER_CLASS}" style="width:20px;height:20px;">
      <span class="absolute inset-[-8px] rounded-full blur-[2px] ${PULSE_CLASS}" style="background:${color};opacity:0.35;"></span>
      <span class="relative h-3 w-3 rounded-full border-2 border-white" style="background:${color}; box-shadow:0 0 8px ${color}cc;"></span>
    </div>
  `;

  return L.divIcon({
    html,
    className: "user-location-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}
