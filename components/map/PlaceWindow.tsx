"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, LogIn, LogOut, Trash2, Star, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Place } from "@/lib/types";
import { PLACE_TYPE_META } from "@/lib/places-meta";
import { spendCategoriesFor } from "@/lib/spending-categories";
import { usePlaces } from "@/lib/places-context";
import { useHousehold } from "@/lib/household-context";
import { useTasks } from "@/lib/tasks-context";
import { AuraAvatar } from "../ui/AuraAvatar";
import { MultiPersonPicker } from "../ui/MultiPersonPicker";
import { personColor } from "@/lib/person-color";
import { auraIntensity } from "@/lib/aura-intensity";
import { Button } from "../ui/Button";
import { SpentPrompt } from "../ui/SpentPrompt";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { RatingControl } from "./RatingControl";
import { MapView } from "./MapView";
import { AddressAutocomplete } from "../ui/AddressAutocomplete";
import { AddressSuggestion } from "@/lib/geocode";
import { useMapAddressPick } from "@/lib/use-map-address-pick";
import { useMood } from "@/lib/mood-context";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { AddPlaceModal } from "./AddPlaceModal";

function isSameWeek(d: Date, ref: Date) {
  const start = new Date(ref);
  start.setDate(ref.getDate() - ref.getDay());
  start.setHours(0, 0, 0, 0);
  return d >= start;
}
function isSameMonth(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
function isSameYear(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear();
}

export function PlaceWindow({ place, onClose }: { place: Place; onClose: () => void }) {
  const { checkIn, checkOut, setRating, removePlace, setLastVisitSpentBreakdown, updatePlace, places } = usePlaces();
  const { fireTrigger } = useMood();
  const { people } = useHousehold();
  const { tasks } = useTasks();
  const meta = PLACE_TYPE_META[place.type];
  const resolvedPhoto = useResolvedImage(place.photoUrl);
  const Icon = meta.icon;
  const [companions, setCompanions] = useState<string[]>([]);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [showSpentPrompt, setShowSpentPrompt] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingPlace, setEditingPlace] = useState(false);
  const pendingRatingRef = useRef(false);

  const isCheckedIn = Boolean(place.currentVisitStartedAt);
  const isHome = Boolean(place.isPrimaryHome);

  // Modifica della posizione — solo per la Casa (le altre voci si spostano semplicemente
  // eliminandole e aggiungendone una nuova nel punto giusto, ma la Casa è quella da cui
  // dipende tutto il rilevamento "sei a casa/fuori casa": spostarla deve restare la stessa
  // voce, non doverla ricreare da capo perdendo la cronologia delle visite.
  const [editingPosition, setEditingPosition] = useState(false);
  const [draftAddress, setDraftAddress] = useState(place.address);
  const [draftCoords, setDraftCoords] = useState<{ lat: number; lng: number } | null>({ lat: place.lat, lng: place.lng });
  const { onPick: onMapPick, resolving: resolvingAddress } = useMapAddressPick(draftAddress, setDraftAddress, setDraftCoords);

  const startEditingPosition = () => {
    setDraftAddress(place.address);
    setDraftCoords({ lat: place.lat, lng: place.lng });
    setEditingPosition(true);
  };

  const savePosition = () => {
    if (!draftCoords || !draftAddress.trim()) return;
    updatePlace(place.id, { address: draftAddress.trim(), lat: draftCoords.lat, lng: draftCoords.lng });
    setEditingPosition(false);
  };

  const counts = useMemo(() => {
    const now = new Date();
    const dates = place.visitsHistory.map((v) => new Date(v.date));
    return {
      week: dates.filter((d) => isSameWeek(d, now)).length,
      month: dates.filter((d) => isSameMonth(d, now)).length,
      year: dates.filter((d) => isSameYear(d, now)).length,
      total: dates.length,
    };
  }, [place.visitsHistory]);

  const doCheckOut = () => {
    const { promptRating, askSpent } = checkOut(place.id, companions);
    setCompanions([]);
    pendingRatingRef.current = promptRating;
    if (askSpent) {
      setShowSpentPrompt(true);
    } else if (promptRating) {
      setShowRatingPrompt(true);
    }
    fireTrigger(`luogo:${place.type}`);
  };

  const onSpentPromptClose = () => {
    setShowSpentPrompt(false);
    if (pendingRatingRef.current) setShowRatingPrompt(true);
  };
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[90dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="relative z-10 h-32 w-full shrink-0">
          {resolvedPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolvedPhoto} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${meta.color}33, transparent)` }}
            >
              <Icon size={34} style={{ color: meta.color }} />
            </div>
          )}
          <button
            onClick={onClose}
            className="focus-ring absolute right-3 top-3 rounded-full bg-void-950/70 p-1.5 text-ink-100"
            aria-label="Chiudi"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <span
              className="mb-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide"
              style={{ background: `${meta.color}22`, color: meta.color }}
            >
              <Icon size={11} /> {meta.label}
            </span>
            <h2 className="font-display text-xl text-ink-100">{place.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
              <MapPin size={13} /> {place.address}
            </p>
            <div className="mt-1.5 flex items-center gap-3">
              {/* Corretto secondo le istruzioni: prima un luogo non si poteva più modificare
                 una volta creato (solo eliminare e ricrearne uno nuovo, perdendo cronologia e
                 valutazione) — ora apre lo stesso modulo di creazione, precompilato. */}
              <button
                onClick={() => setEditingPlace(true)}
                className="focus-ring flex items-center gap-1.5 text-xs text-aura-violet hover:text-ink-100"
              >
                <Pencil size={12} /> Modifica luogo
              </button>
              {isHome && !editingPosition && (
                <button
                  onClick={startEditingPosition}
                  className="focus-ring flex items-center gap-1.5 text-xs text-aura-violet hover:text-ink-100"
                >
                  <Pencil size={12} /> Modifica posizione
                </button>
              )}
            </div>
          </div>

          {isHome && editingPosition && (
            <div className="space-y-3 rounded-xl2 border border-aura-violet/25 bg-aura-violet/[0.05] p-3.5">
              <p className="text-xs text-ink-600">Tocca il nuovo punto sulla mappa, o cerca l'indirizzo.</p>
              <div className="relative h-52 overflow-hidden rounded-xl2 border border-white/10">
                <MapView
                  places={[]}
                  center={draftCoords ?? { lat: place.lat, lng: place.lng }}
                  pickMode
                  onPick={onMapPick}
                  draftMarker={draftCoords}
                />
              </div>
              <AddressAutocomplete
                label={resolvingAddress ? "Indirizzo (sto cercando…)" : "Indirizzo"}
                placeholder="Es. Via Roma 12, Milano"
                value={draftAddress}
                onChange={setDraftAddress}
                onSelect={(s: AddressSuggestion) => {
                  setDraftCoords({ lat: s.lat, lng: s.lng });
                  setDraftAddress(s.label);
                }}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 justify-center" onClick={() => setEditingPosition(false)}>
                  Annulla
                </Button>
                <Button className="flex-1 justify-center" onClick={savePosition} disabled={!draftCoords || !draftAddress.trim()}>
                  Salva posizione
                </Button>
              </div>
            </div>
          )}

          {!isHome && (
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ["Settimana", counts.week],
                ["Mese", counts.month],
                ["Anno", counts.year],
                ["Sempre", counts.total],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-xl2 border border-white/10 bg-white/[0.02] py-2.5">
                  <p className="font-display text-base text-ink-100">{val}</p>
                  <p className="text-[10px] text-ink-800">{label}</p>
                </div>
              ))}
            </div>
          )}

          {(place.rating !== null || showRatingPrompt || isHome) && (
            <RatingControl
              value={place.rating ?? 50}
              onChange={(v) => {
                setRating(place.id, v);
                if (v >= 80) fireTrigger("luogo:valutazione-alta");
                else if (v < 20) fireTrigger("luogo:valutazione-bassa");
              }}
            />
          )}
          {place.rating === null && !showRatingPrompt && !isHome && (
            <button
              onClick={() => setRating(place.id, 50)}
              className="focus-ring flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-200"
            >
              <Star size={13} /> Valuta questo luogo
            </button>
          )}

          {!isHome && (
            <div>
              {!isCheckedIn ? (
                <>
                  <Button variant="outline" className="w-full justify-center" onClick={() => checkIn(place.id)}>
                    <LogIn size={15} /> Sono qui
                  </Button>
                  <p className="mt-1.5 text-center text-[11px] text-ink-800">
                    Con il rilevamento attivo, te lo chiediamo da soli entro 100 metri.
                  </p>
                </>
              ) : (
                <div className="space-y-3 rounded-xl2 border border-aura-cyan/30 bg-aura-cyan/[0.05] p-4">
                  <MultiPersonPicker
                    label="Con chi eri? (facoltativo)"
                    values={companions}
                    options={people}
                    onChange={setCompanions}
                    trigger={(open) => (
                      <button type="button" onClick={open} className="flex flex-wrap items-center gap-2">
                        {companions.length === 0 && <span className="text-xs text-ink-800">Tocca per scegliere</span>}
                        {companions.slice(0, 8).map((id) => {
                          const p = people.find((x) => x.id === id);
                          if (!p) return null;
                          return (
                            <AuraAvatar
                              key={id}
                              imageUrl={p.avatarUrl}
                              firstName={p.firstName}
                              lastName={p.lastName}
                              size={36}
                              ring="idle"
                              glowColor={personColor(p.id)}
                              glowIntensity={auraIntensity(p, tasks, places)}
                              deceased={p.deceased}
                            />
                          );
                        })}
                        {companions.length > 8 && (
                          <span className="text-xs text-ink-600">+{companions.length - 8}</span>
                        )}
                      </button>
                    )}
                  />
                  <Button className="w-full justify-center" onClick={doCheckOut}>
                    <LogOut size={15} /> Esci da qui
                  </Button>
                </div>
              )}
            </div>
          )}

          {place.visitsHistory.length > 0 && (
            <div>
              <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
                Cronologia
              </p>
              <div className="space-y-2">
                {[...place.visitsHistory].reverse().slice(0, 6).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs"
                  >
                    <span className="text-ink-400">
                      {new Date(v.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                    </span>
                    <div className="flex -space-x-2">
                      {v.withPersonIds.length === 0 ? (
                        <span className="text-ink-800">Da solo</span>
                      ) : (
                        v.withPersonIds.slice(0, 3).map((id) => {
                          const p = people.find((x) => x.id === id);
                          if (!p) return null;
                          return (
                            <AuraAvatar
                              key={id}
                              imageUrl={p.avatarUrl}
                              firstName={p.firstName}
                              lastName={p.lastName}
                              size={22}
                              ring="idle"
                              glowColor={personColor(p.id)}
                              glowIntensity={auraIntensity(p, tasks, places)}
                              deceased={p.deceased}
                              className="border border-void-900"
                            />
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isHome && (
            <Button
              variant="danger"
              size="sm"
              className="w-full justify-center"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={13} /> Rimuovi luogo
            </Button>
          )}
        </div>
      </motion.div>

      {editingPlace && <AddPlaceModal place={place} onClose={() => setEditingPlace(false)} />}

      {showSpentPrompt && (
        <SpentPrompt
          splitCategories={spendCategoriesFor(place.type)}
          onConfirm={(breakdown) => setLastVisitSpentBreakdown(place.id, breakdown)}
          onClose={onSpentPromptClose}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Rimuovere ${place.name}?`}
          description="Cronologia visite e valutazione andranno perse per sempre."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            removePlace(place.id);
            onClose();
          }}
        />
      )}
    </div>,
    document.body
  );
}
