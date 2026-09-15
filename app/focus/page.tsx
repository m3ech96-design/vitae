"use client";
import { useState } from "react";
import { Play, Settings as SettingsIcon } from "lucide-react";
import { usePomodoro } from "@/lib/pomodoro-context";
import { FocusRunView } from "@/components/pomodoro/FocusRunView";
import { StartFocusModal } from "@/components/pomodoro/StartFocusModal";
import { FocusSettingsModal } from "@/components/pomodoro/FocusSettingsModal";
import { FocusHistorySection } from "@/components/pomodoro/FocusHistorySection";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export default function FocusPage() {
  const { hydrated, activeRun } = usePomodoro();
  const [startOpen, setStartOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-600">Focus</p>
          <h1 className="mt-1 font-display text-2xl text-ink-100">Cicli di concentrazione</h1>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink-400 hover:border-white/25 hover:text-ink-100"
          aria-label="Impostazioni cicli"
        >
          <SettingsIcon size={16} />
        </button>
      </div>

      <div className="mt-6">
        <GlassCard className="p-6">
          {activeRun ? (
            <FocusRunView />
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-center text-sm text-ink-600">Nessuna sessione in corso.</p>
              <Button onClick={() => setStartOpen(true)}>
                <Play size={16} /> Avvia sessione
              </Button>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="mt-6">
        <GlassCard className="p-4">
          <FocusHistorySection />
        </GlassCard>
      </div>

      {startOpen && <StartFocusModal onClose={() => setStartOpen(false)} />}
      {settingsOpen && <FocusSettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
