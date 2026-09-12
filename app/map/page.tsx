"use client";
import { useMemo, useState } from "react";
import { Plus, MapPin, LocateFixed, Locate } from "lucide-react";
import { usePlaces } from "@/lib/places-context";
import { useHousehold } from "@/lib/household-context";
import { PLACE_TYPE_META } from "@/lib/places-meta";
import { MapView } from "@/components/map/MapView";
import { AddPlaceModal } from "@/components/map/AddPlaceModal";
import { PlaceWindow } from "@/components/map/PlaceWindow";
import { Place } from "@/lib/types";
import { ratingLabel, ratingColor } from "@/lib/rating";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { DEFAULT_MAP_CENTER } from "@/lib/geo";

function PlaceIcon({ place }: { place: Place }) {
  const meta = PLACE_TYPE_META[place.type];
  const Icon = meta.icon;
  const resolved = useResolvedImage(place.photoUrl);
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl2"
      style={{ background: `${meta.color}22` }}
    >
      {resolved ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolved} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon size={18} style={{ color: meta.color }} />
      )}
    </span>
  );
}

type SortMode = "rating-desc" | "rating-asc" | "visits-desc" | "visits-asc";

const SORT_LABEL: Record<SortMode, string> = {
  "rating-desc": "Valutazione ↓",
  "rating-asc": "Valutazione ↑",
  "visits-desc": "Visite ↓",
  "visits-asc": "Visite ↑",
};

export default function MapPage() {
  const { hydrated, places } = usePlaces();
  const { home } = useHousehold();
  const [addOpen, setAddOpen] = useState(false);
  const [openPlaceId, setOpenPlaceId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("rating-desc");
  const [flyToPlace, setFlyToPlace] = useState<{ lat: number; lng: number; at: number } | null>(null);
  const [recenterOnUserAt, setRecenterOnUserAt] = useState<number | null>(null);

  const center = home ? { lat: home.lat, lng: home.lng } : DEFAULT_MAP_CENTER;

  const sorted = useMemo(() => {
    const arr = [...places];
    arr.sort((a, b) => {
      if (sort === "rating-desc") return (b.rating ?? -1) - (a.rating ?? -1);
      if (sort === "rating-asc") return (a.rating ?? 101) - (b.rating ?? 101);
      if (sort === "visits-desc") return b.visitsHistory.length - a.visitsHistory.length;
      return a.visitsHistory.length - b.visitsHistory.length;
    });
    arr.sort((a, b) => (b.currentVisitStartedAt ? 1 : 0) - (a.currentVisitStartedAt ? 1 : 0));
    return arr;
  }, [places, sort]);

  const openPlace: Place | undefined = sorted.find((p) => p.id === openPlaceId);

  if (!hydrated) return null;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <div className="relative h-[44vh] w-full shrink-0">
        <MapView
          places={places}
          center={center}
          onMarkerClick={(p) => setOpenPlaceId(p.id)}
          showUserLocation
          flyToPlace={flyToPlace}
          recenterOnUserRequestAt={recenterOnUserAt}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 pt-[max(env(safe-area-inset-top),16px)]">
          <div className="glass pointer-events-auto rounded-full px-4 py-2">
            <p className="font-display text-xs uppercase tracking-[0.2em] text-ink-200">Mappa</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setAddOpen(true)}
              className="focus-ring pointer-events-auto flex items-center gap-1.5 rounded-full bg-aura-gradient px-4 py-2 text-xs font-display text-void-950 shadow-glow"
            >
              <Plus size={14} /> Aggiungi luogo
            </button>
            {/* Corretto secondo le istruzioni: subito sotto "Aggiungi luogo", a destra —
               centra la mappa sulla posizione live dell'utente. */}
            <button
              onClick={() => setRecenterOnUserAt(Date.now())}
              className="focus-ring pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-void-950/70 text-ink-100 backdrop-blur-md"
              aria-label="Centra la mappa su di me"
            >
              <LocateFixed size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-strong relative -mt-5 flex min-h-0 flex-1 flex-col rounded-t-xl3 border-t border-white/10 px-5 pt-5">
        <div className="shrink-0 relative z-10 mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        <div className="shrink-0 relative z-10 mb-4 flex items-center justify-between gap-3">
          <p className="shrink-0 font-display text-sm text-ink-100">{places.length} luoghi</p>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {(Object.keys(SORT_LABEL) as SortMode[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`focus-ring shrink-0 rounded-full border px-3 py-1.5 text-[11px] transition ${
                  sort === s
                    ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100"
                    : "border-white/10 text-ink-800"
                }`}
              >
                {SORT_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto pb-28">
          {sorted.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <MapPin size={22} className="text-ink-800" />
              <p className="text-sm text-ink-600">Non hai ancora registrato nessun luogo.</p>
            </div>
          )}
          {sorted.map((p) => {
            return (
              // Prima era un <button>: un <button> dentro l'altro (la nuova icona "centra
              // sul luogo" qui sotto ne rende uno suo) non è HTML valido — stesso bug già
              // corretto altrove nell'app per lo stesso identico motivo.
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setOpenPlaceId(p.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenPlaceId(p.id)}
                className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:border-white/15"
              >
                <PlaceIcon place={p} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm text-ink-100">
                    {p.name}
                    {p.currentVisitStartedAt && (
                      <span className="ml-2 text-[10px] text-aura-cyan">&middot; sei qui</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-800">{p.address}</p>
                  <p
                    className="text-xs"
                    style={{ color: p.rating !== null ? ratingColor(p.rating) : "#565B77" }}
                  >
                    {p.rating !== null ? ratingLabel(p.rating) : "Non valutato"}
                  </p>
                </div>
                {/* Corretto secondo le istruzioni: a destra nella card, centra la mappa su
                   questo luogo senza aprire la sua scheda. */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlyToPlace({ lat: p.lat, lng: p.lng, at: Date.now() });
                  }}
                  className="focus-ring shrink-0 rounded-full p-2 text-ink-600 hover:bg-white/[0.06] hover:text-aura-violet"
                  aria-label={`Centra la mappa su ${p.name}`}
                >
                  <Locate size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {addOpen && <AddPlaceModal onClose={() => setAddOpen(false)} />}
      {openPlace && <PlaceWindow place={openPlace} onClose={() => setOpenPlaceId(null)} />}
    </div>
  );
}
