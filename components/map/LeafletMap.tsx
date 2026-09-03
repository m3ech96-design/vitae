"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Place } from "@/lib/types";
import { PLACE_TYPE_META } from "@/lib/places-meta";
import { createAuraDivIcon, createUserLocationDivIcon } from "@/lib/aura-marker";
import { useLiveLocation, LiveLocation } from "@/lib/use-live-location";

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Quanti punti tenere in coda — pochi, così la scia resta un accenno di movimento, non
 * una traccia GPS invadente sulla mappa. */
const TRAIL_MAX = 6;

/** Pallino "Sei Qui": posizione GPS live, aggiornata finché la mappa resta aperta.
 * Con `recenterOnce`, la mappa si sposta lì una sola volta, al primo fix — non ad ogni
 * aggiornamento, per non strappare la vista mentre l'utente sta guardando altrove.
 * Le posizioni via via campionate — che finora finivano scartate appena arrivava il fix
 * successivo — restano ora in coda per un breve tratto e si vedono sfumare dietro al
 * pallino: non solo "dove sei", anche "come ti sei mosso per arrivarci". */
function LiveLocationLayer({
  recenterOnce = false,
  recenterRequestAt,
}: {
  recenterOnce?: boolean;
  /** Cambia ogni volta che l'utente tocca "centra su di me" — un token, non una posizione:
   * anche chiedendo di ricentrare due volte di fila sullo stesso punto, il cambio di valore
   * (un timestamp) fa scattare comunque l'effetto. */
  recenterRequestAt?: number | null;
}) {
  const map = useMap();
  const { position } = useLiveLocation(true);
  const hasRecenteredRef = useRef(false);
  const lastManualRecenterRef = useRef<number | null>(null);
  const icon = useMemo(() => createUserLocationDivIcon(), []);
  const [trail, setTrail] = useState<LiveLocation[]>([]);

  useEffect(() => {
    if (position && recenterOnce && !hasRecenteredRef.current) {
      hasRecenteredRef.current = true;
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [position, recenterOnce, map]);

  useEffect(() => {
    if (!position || !recenterRequestAt || recenterRequestAt === lastManualRecenterRef.current) return;
    lastManualRecenterRef.current = recenterRequestAt;
    map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15));
  }, [position, recenterRequestAt, map]);

  useEffect(() => {
    if (!position) return;
    setTrail((prev) => {
      const last = prev[prev.length - 1];
      // Non accodare se non ti sei davvero mosso, altrimenti la scia si riempie di punti
      // identici sovrapposti mentre stai semplicemente fermo con il telefono in mano.
      if (last && last.lat === position.lat && last.lng === position.lng) return prev;
      const next = [...prev, position];
      return next.length > TRAIL_MAX ? next.slice(next.length - TRAIL_MAX) : next;
    });
  }, [position]);

  if (!position) return null;

  // L'ultimo punto in coda È il punto attuale (mostrato dal marker pulsante, non qui
  // sotto) — la scia disegna solo quelli prima, più vecchio-e-piccolo mano a mano che si
  // risale indietro nel tempo.
  const trailBehind = trail.slice(0, -1);

  return (
    <>
      {trailBehind.map((p, i) => {
        const age = trailBehind.length - i; // 1 = il punto appena prima di quello attuale
        const fade = Math.max(0, 1 - age / (TRAIL_MAX + 1));
        return (
          <CircleMarker
            key={`${p.lat}-${p.lng}-${i}`}
            center={[p.lat, p.lng]}
            radius={2 + fade * 3}
            pathOptions={{ color: "#4F8CFF", fillColor: "#4F8CFF", fillOpacity: fade * 0.45, weight: 0 }}
          />
        );
      })}
      <Marker position={[position.lat, position.lng]} icon={icon} title="La tua posizione attuale" />
    </>
  );
}

/** Sposta la mappa su un punto qualunque su richiesta — usata da "centra la mappa sul
 * luogo" nelle card dei luoghi. Stesso principio del token in LiveLocationLayer: `at`
 * cambia sempre, anche richiedendo due volte di fila lo stesso punto. */
function FlyToController({ target }: { target: { lat: number; lng: number; at: number } | null }) {
  const map = useMap();
  const lastAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (!target || target.at === lastAtRef.current) return;
    lastAtRef.current = target.at;
    map.setView([target.lat, target.lng], Math.max(map.getZoom(), 15));
  }, [target, map]);
  return null;
}

export function LeafletMap({
  places,
  center,
  onMarkerClick,
  pickMode = false,
  onPick,
  draftMarker,
  showUserLocation = false,
  recenterOnUserLocation = false,
  flyToPlace,
  recenterOnUserRequestAt,
}: {
  places: Place[];
  center: { lat: number; lng: number };
  onMarkerClick?: (place: Place) => void;
  pickMode?: boolean;
  onPick?: (lat: number, lng: number) => void;
  draftMarker?: { lat: number; lng: number } | null;
  /** Mostra il pallino "Sei Qui" con la posizione GPS live dell'utente. */
  showUserLocation?: boolean;
  /** Al primo fix GPS, sposta la mappa lì una sola volta (utile quando si parte senza un
   * centro sensato, es. collegare Casa la prima volta). Richiede `showUserLocation`. */
  recenterOnUserLocation?: boolean;
  /** Cambia (un punto + un token) per spostare la mappa lì su richiesta — "centra la mappa
   * sul luogo" da una card. */
  flyToPlace?: { lat: number; lng: number; at: number } | null;
  /** Cambia (un token) per ricentrare sulla posizione live dell'utente su richiesta —
   * richiede `showUserLocation`. */
  recenterOnUserRequestAt?: number | null;
}) {
  const draftIcon = useMemo(() => createAuraDivIcon("#00E5C7", { shape: "circle", size: 30 }), []);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={15}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#E5E3DF" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> Contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((p) => {
        const meta = PLACE_TYPE_META[p.type];
        const icon = createAuraDivIcon(meta.color, {
          shape: meta.shape,
          active: Boolean(p.currentVisitStartedAt),
          icon: meta.icon,
        });
        return (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={icon}
            title={`${p.name} — ${meta.label}${p.currentVisitStartedAt ? " — sei qui" : ""}`}
            eventHandlers={{ click: () => onMarkerClick?.(p) }}
          />
        );
      })}
      {draftMarker && (
        <Marker position={[draftMarker.lat, draftMarker.lng]} icon={draftIcon} title="Punto selezionato sulla mappa" />
      )}
      {pickMode && onPick && <ClickCatcher onPick={onPick} />}
      {showUserLocation && <LiveLocationLayer recenterOnce={recenterOnUserLocation} recenterRequestAt={recenterOnUserRequestAt} />}
      <FlyToController target={flyToPlace ?? null} />
    </MapContainer>
  );
}
