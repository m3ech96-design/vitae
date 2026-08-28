"use client";
import { useMemo, useRef, useState } from "react";
import { X, MapPin, LogIn, LogOut, Trash2, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Place } from "@/lib/types";
import { PLACE_TYPE_META, SPENDING_PLACE_TYPES } from "@/lib/places-meta";
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
import { useMood } from "@/lib/mood-context";
import { useResolvedImage } from "@/lib/use-resolved-image";

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
  const { checkIn, checkOut, setRating, removePlace, setLastVisitSpentBreakdown, places } = usePlaces();
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
  const pendingRatingRef = useRef(false);

  const isCheckedIn = Boolean(place.currentVisitStartedAt);
  const isHome = Boolean(place.isPrimaryHome);

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
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
          </div>

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
              <Star size={13} /> Valuta Questo Luogo
            </button>
          )}

          {!isHome && (
            <div>
              {!isCheckedIn ? (
                <>
                  <Button variant="outline" className="w-full justify-center" onClick={() => checkIn(place.id)}>
                    <LogIn size={15} /> Sono Qui
                  </Button>
                  <p className="mt-1.5 text-center text-[11px] text-ink-800">
                    Con Il Rilevamento Attivo, Te Lo Chiediamo Da Soli Entro 100 Metri.
                  </p>
                </>
              ) : (
                <div className="space-y-3 rounded-xl2 border border-aura-cyan/30 bg-aura-cyan/[0.05] p-4">
                  <MultiPersonPicker
                    label="Con Chi Eri? (Facoltativo)"
                    values={companions}
                    options={people}
                    onChange={setCompanions}
                    trigger={(open) => (
                      <button type="button" onClick={open} className="flex flex-wrap items-center gap-2">
                        {companions.length === 0 && <span className="text-xs text-ink-800">Tocca Per Scegliere</span>}
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
                    <LogOut size={15} /> Esci Da Qui
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
                        <span className="text-ink-800">Da Solo</span>
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
              <Trash2 size={13} /> Rimuovi Luogo
            </Button>
          )}
        </div>
      </motion.div>

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
          description="Cronologia Visite E Valutazione Andranno Perse Per Sempre."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            removePlace(place.id);
            onClose();
          }}
        />
      )}
    </div>
  );
}
