"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle, MinusCircle, HelpCircle, Info, Sparkles, Settings2 } from "lucide-react";
import { useHealth } from "@/lib/health-context";
import { useFood } from "@/lib/food-context";
import { useProfile } from "@/lib/profile-context";
import { wellbeingReport, inLineStreakWeeks, isFirstTimeInLine, AspectStatus } from "@/lib/wellbeing-report";
import {
  caloriesAsFoodCuriosity,
  distanceCuriosity,
  timeAsEpisodesCuriosity,
  waterAsBottlesCuriosity,
  monthlyComparisonCuriosity,
  yearlyProjectionCuriosity,
  mostEatenCuriosity,
  populationComparisonCuriosity,
  Curiosity,
} from "@/lib/wellbeing-curiosities";
import { WHO_WEEKLY_MODERATE_MINUTES } from "@/lib/health-guidelines";
import { GlassCard } from "@/components/ui/GlassCard";

const STATUS_META: Record<AspectStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  "in-linea": { icon: CheckCircle2, color: "#34D399", label: "In linea" },
  vicino: { icon: MinusCircle, color: "#FFB454", label: "Quasi" },
  lontano: { icon: AlertCircle, color: "#FF6B9D", label: "Da migliorare" },
  "dati-insufficienti": { icon: HelpCircle, color: "#8B90A8", label: "Dati insufficienti" },
};

export default function WellbeingReportPage() {
  const router = useRouter();
  const { hydrated: healthHydrated, workouts, weightEntries } = useHealth();
  const { hydrated: foodHydrated, entries: foodEntries, ingredients, waterLog } = useFood();
  const { profile, updateProfile } = useProfile();

  const hydrated = healthHydrated && foodHydrated;
  const enabled = profile.wellbeingReportEnabled !== false;

  const wellbeingData = useMemo(
    () => ({ workouts, foodEntries, ingredients, waterLog, weightEntries }),
    [workouts, foodEntries, ingredients, waterLog, weightEntries]
  );

  const report = useMemo(() => (hydrated ? wellbeingReport(wellbeingData) : null), [hydrated, wellbeingData]);

  // Streak e achievement richiedono di rivalutare fino a 52 settimane passate — costoso
  // abbastanza da meritare un useMemo dedicato, non da ricalcolare a ogni render.
  const streak = useMemo(() => (hydrated ? inLineStreakWeeks(wellbeingData) : 0), [hydrated, wellbeingData]);
  const firstTime = useMemo(() => (hydrated && streak === 1 ? isFirstTimeInLine(wellbeingData) : false), [hydrated, streak, wellbeingData]);

  const aerobicAspect = report?.aspects.find((a) => a.id === "attivita-aerobica");
  const aerobicValue = aerobicAspect ? parseInt(aerobicAspect.detail, 10) || 0 : 0;

  const curiosities: Curiosity[] = useMemo(() => {
    if (!hydrated) return [];
    return [
      caloriesAsFoodCuriosity(workouts),
      distanceCuriosity(workouts),
      timeAsEpisodesCuriosity(workouts),
      waterAsBottlesCuriosity(waterLog),
      monthlyComparisonCuriosity(workouts),
      yearlyProjectionCuriosity(workouts),
      mostEatenCuriosity(foodEntries, ingredients),
      populationComparisonCuriosity(aerobicValue, WHO_WEEKLY_MODERATE_MINUTES),
    ].filter((c): c is Curiosity => c !== null);
  }, [hydrated, workouts, waterLog, foodEntries, ingredients, aerobicValue]);

  if (!hydrated) return null;

  if (!enabled) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
        <button onClick={() => router.back()} className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200">
          <ArrowLeft size={15} /> Indietro
        </button>
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Settings2 size={22} className="text-ink-800" />
          <p className="text-sm text-ink-600">Hai disattivato il resoconto di benessere.</p>
          <button
            onClick={() => updateProfile({ wellbeingReportEnabled: true })}
            className="focus-ring rounded-full border border-white/10 px-4 py-2 text-xs text-ink-300 hover:border-aura-cyan/50"
          >
            Riattivalo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200">
          <ArrowLeft size={15} /> Indietro
        </button>
        <button
          onClick={() => updateProfile({ wellbeingReportEnabled: false })}
          className="focus-ring flex items-center gap-1.5 text-[11px] text-ink-800 hover:text-ink-300"
        >
          <Settings2 size={12} /> Disattiva
        </button>
      </div>

      <p className="mt-4 font-display text-xs uppercase tracking-[0.28em] text-ink-600">Salute</p>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Resoconto della settimana</h1>

      {/* Nessuna etichetta binaria "in salute/non in salute" — un rapporto onesto tra
          aspetti valutabili, con la scomposizione sempre a un tap di distanza. Vedi il
          ragionamento in wellbeing-report.ts sul perché quell'etichetta è stata scartata. */}
      {report && report.evaluableCount > 0 ? (
        <GlassCard className="mt-5 p-4">
          <p className="font-display text-lg text-ink-100">
            {report.goodCount} su {report.evaluableCount} aspetti in linea con le linee guida
          </p>
          {streak >= 2 && <p className="mt-1 text-xs text-aura-emerald">{streak} settimane di fila così</p>}
          {firstTime && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-aura-amber">
              <Sparkles size={12} /> Prima volta che raggiungi tutti gli aspetti valutabili questa settimana!
            </p>
          )}
        </GlassCard>
      ) : (
        <GlassCard className="mt-5 p-4">
          <p className="text-sm text-ink-600">Non ci sono ancora abbastanza dati questa settimana per un resoconto affidabile.</p>
        </GlassCard>
      )}

      <div className="mt-3 flex items-start gap-2 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[11px] leading-relaxed text-ink-600">
        <Info size={13} className="mt-0.5 shrink-0" />
        <p>
          Questo resoconto confronta i tuoi dati con le linee guida generali OMS e CREA — non è un parere medico e non
          tiene conto di condizioni individuali. Per qualunque dubbio sulla tua salute, parlane con un professionista.
        </p>
      </div>

      {report && report.aspects.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Confronto con le linee guida</p>
          <div className="flex snap-x gap-3 overflow-x-auto pb-2 no-scrollbar">
            {report.aspects.map((a) => {
              const meta = STATUS_META[a.status];
              const Icon = meta.icon;
              return (
                <div key={a.id} className="w-52 shrink-0 snap-start rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl2" style={{ background: `${meta.color}22` }}>
                    <Icon size={15} style={{ color: meta.color }} />
                  </span>
                  <p className="mt-2.5 text-sm text-ink-100">{a.label}</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                  <p className="mt-1.5 text-[11px] text-ink-600">{a.detail}</p>
                  <p className="mt-2 text-[10px] text-ink-800">Fonte: {a.source}</p>
                </div>
              );
            })}
          </div>
          {report.weightTrendKg !== null && (
            <p className="mt-2 text-[11px] text-ink-800">
              Tendenza del peso: {report.weightTrendKg > 0 ? "+" : ""}
              {report.weightTrendKg.toFixed(1)} kg di recente — informativo, nessuna soglia di riferimento si applica al
              peso corporeo.
            </p>
          )}
        </div>
      )}

      {curiosities.length > 0 && (
        <div className="mt-7">
          <p className="mb-3 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
            <Sparkles size={12} className="text-aura-amber" /> Curiosità della settimana
          </p>
          <div className="space-y-2">
            {curiosities.map((c) => (
              <div key={c.id} className="rounded-xl2 border border-aura-amber/20 bg-aura-amber/[0.04] px-3.5 py-3 text-xs text-ink-300">
                {c.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
