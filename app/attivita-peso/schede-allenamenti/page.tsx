"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Dumbbell, ChevronRight } from "lucide-react";
import { useWorkoutPlans } from "@/lib/workout-plans-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { AddPlanSheet } from "@/components/health/workout-plans/AddPlanSheet";

export default function WorkoutPlansPage() {
  const router = useRouter();
  const { hydrated, plans, addPlan } = useWorkoutPlans();
  const [addOpen, setAddOpen] = useState(false);

  const sorted = [...plans].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button
        onClick={() => router.back()}
        className="focus-ring flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-200"
      >
        <ArrowLeft size={14} /> Indietro
      </button>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Attività e peso</p>
          <h1 className="mt-1 font-display text-2xl text-ink-100">Schede allenamenti</h1>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="focus-ring flex items-center gap-1.5 rounded-full bg-aura-gradient px-3.5 py-2 text-[11px] font-display text-void-950 shadow-glow"
        >
          <Plus size={13} /> Scheda
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="mt-14 flex flex-col items-center gap-2 text-center">
          <Dumbbell size={22} className="text-ink-800" />
          <p className="text-sm text-ink-600">Non hai ancora creato nessuna scheda allenamento.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2.5">
          {sorted.map((plan) => (
            <Link key={plan.id} href={`/attivita-peso/schede-allenamenti/${plan.id}`}>
              <GlassCard className="flex items-center gap-3 p-4 transition hover:border-white/20">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl2 bg-aura-violet/15">
                  <Dumbbell size={17} className="text-aura-violet" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm text-ink-100">{plan.name}</p>
                  <p className="mt-0.5 text-xs text-ink-600">
                    {plan.tables.length === 0
                      ? "Nessuna tabella"
                      : `${plan.tables.length} ${plan.tables.length === 1 ? "tabella" : "tabelle"}`}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-ink-800" />
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      {addOpen && (
        <AddPlanSheet
          onCreate={(name) => {
            const plan = addPlan(name);
            router.push(`/attivita-peso/schede-allenamenti/${plan.id}`);
          }}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}
