"use client";
import { useState } from "react";
import { Settings, X } from "lucide-react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { usePomodoro } from "@/lib/pomodoro-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Switch } from "../ui/Switch";

export function FocusSettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = usePomodoro();
  const [workMinutes, setWorkMinutes] = useState(String(settings.workMinutes));
  const [breakMinutes, setBreakMinutes] = useState(String(settings.breakMinutes));
  const [longBreakMinutes, setLongBreakMinutes] = useState(String(settings.longBreakMinutes));
  const [longBreakEvery, setLongBreakEvery] = useState(String(settings.longBreakEvery));
  const [autoStartNext, setAutoStartNext] = useState(settings.autoStartNext);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);

  const submit = () => {
    updateSettings({
      workMinutes: Math.max(1, parseInt(workMinutes, 10) || settings.workMinutes),
      breakMinutes: Math.max(1, parseInt(breakMinutes, 10) || settings.breakMinutes),
      longBreakMinutes: Math.max(1, parseInt(longBreakMinutes, 10) || settings.longBreakMinutes),
      longBreakEvery: Math.max(1, parseInt(longBreakEvery, 10) || settings.longBreakEvery),
      autoStartNext,
      soundEnabled,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="flex items-center gap-1.5 font-display text-lg text-ink-100">
            <Settings size={16} /> Impostazioni cicli
          </p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Lavoro (min)" type="number" inputMode="numeric" value={workMinutes} onChange={(e) => setWorkMinutes(e.target.value)} />
            <TextField label="Pausa (min)" type="number" inputMode="numeric" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Pausa lunga (min)" type="number" inputMode="numeric" value={longBreakMinutes} onChange={(e) => setLongBreakMinutes(e.target.value)} />
            <TextField label="Ogni N cicli" type="number" inputMode="numeric" value={longBreakEvery} onChange={(e) => setLongBreakEvery(e.target.value)} />
          </div>

          <label className="flex items-center justify-between gap-3 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <span className="min-w-0">
              <span className="block text-xs text-ink-100">Avanza da solo</span>
              <span className="block text-[10px] text-ink-800">La fase successiva parte subito, senza aspettare conferma</span>
            </span>
            <Switch checked={autoStartNext} onChange={setAutoStartNext} tone="violet" />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <span className="min-w-0">
              <span className="block text-xs text-ink-100">Suono a fine fase</span>
              <span className="block text-[10px] text-ink-800">Un avviso sonoro quando lavoro o pausa finiscono</span>
            </span>
            <Switch checked={soundEnabled} onChange={setSoundEnabled} tone="violet" />
          </label>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <Button className="w-full justify-center" onClick={submit}>
            Salva
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
