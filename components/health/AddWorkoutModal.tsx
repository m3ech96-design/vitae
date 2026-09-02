"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search } from "lucide-react";
import { motion } from "framer-motion";
import { todayIso } from "@/lib/date-format";
import { ACTIVITY_CATEGORIES, ACTIVITIES, estimatedCalories } from "@/lib/activity-catalog";
import { useHealth } from "@/lib/health-context";
import { useProfile } from "@/lib/profile-context";
import { useMood } from "@/lib/mood-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

export function AddWorkoutModal({ onClose }: { onClose: () => void }) {
  const { addWorkout, weightEntries } = useHealth();
  const { profile } = useProfile();
  const { fireTrigger } = useMood();
  const [categoryId, setCategoryId] = useState(ACTIVITY_CATEGORIES[0].id);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [calories, setCalories] = useState<string>("");
  const [calorieTouched, setCalorieTouched] = useState(false);
  const [date, setDate] = useState(todayIso());

  // Il peso "attuale" è l'ultima pesata registrata in Salute, se c'è — è quella davvero
  // aggiornata, non il valore scritto una volta nel wizard e mai più toccato (che resta
  // comunque un ripiego valido se non hai ancora registrato nessuna pesata).
  const currentWeightKg = useMemo(() => {
    if (weightEntries.length > 0) {
      const latest = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date))[0];
      return latest.value;
    }
    return profile.weight;
  }, [weightEntries, profile.weight]);

  const activitiesInCategory = useMemo(
    () =>
      ACTIVITIES.filter((a) => a.categoryId === categoryId).filter((a) =>
        a.label.toLowerCase().includes(query.toLowerCase())
      ),
    [categoryId, query]
  );

  const suggestedCalories = useMemo(() => {
    const m = parseFloat(minutes) || 0;
    if (!activityId || m <= 0) return 0;
    return estimatedCalories(activityId, m, currentWeightKg);
  }, [activityId, minutes, currentWeightKg]);

  const effectiveCalories = calorieTouched ? calories : String(suggestedCalories || "");

  const submit = () => {
    if (!activityId || !minutes) return;
    addWorkout({
      activityId,
      minutes: Math.max(1, Math.round(parseFloat(minutes))),
      calories: Math.max(0, Math.round(parseFloat(effectiveCalories) || 0)),
      date,
    });
    fireTrigger("salute:allenamento");
    onClose();
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
        className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 relative z-10 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">Registra attività</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {ACTIVITY_CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setCategoryId(c.id);
                    setActivityId(null);
                  }}
                  className="focus-ring flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all"
                  style={{
                    borderColor: categoryId === c.id ? c.color : "rgba(255,255,255,0.1)",
                    background: categoryId === c.id ? `${c.color}22` : "transparent",
                    color: categoryId === c.id ? "#F1F1FA" : "#8B90A8",
                  }}
                >
                  <Icon size={13} /> {c.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-800" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca attività..."
              className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-4 text-sm text-ink-100 placeholder:text-ink-800"
            />
          </div>

          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
            {activitiesInCategory.map((a) => (
              <button
                key={a.id}
                onClick={() => setActivityId(a.id)}
                className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition-all ${
                  activityId === a.id
                    ? "border-aura-violet/60 bg-aura-violet/15 text-ink-100"
                    : "border-white/10 text-ink-600 hover:text-ink-200"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Minuti"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
            <TextField
              label="Calorie stimate"
              type="number"
              value={effectiveCalories}
              onChange={(e) => {
                setCalorieTouched(true);
                setCalories(e.target.value);
              }}
              hint={
                !calorieTouched
                  ? currentWeightKg
                    ? "Suggerita in base al tuo peso — puoi modificarla"
                    : "Suggerita per un peso medio di riferimento (70 kg) — imposta il tuo in Salute per una stima più precisa"
                  : undefined
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit} disabled={!activityId || !minutes}>
            Registra
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
