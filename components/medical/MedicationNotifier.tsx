"use client";
import { useRef } from "react";
import { useMedical } from "@/lib/medical-context";
import { useNotificationPolling } from "@/lib/use-notification-polling";

/**
 * Stessa meccanica di components/task/TaskNotifier.tsx, applicata agli orari dei farmaci —
 * vedi lib/use-notification-polling.ts per il motivo per cui la strategia di dedup qui è un
 * Set effimero in memoria invece di un flag persistito come in TaskNotifier.
 */
export function MedicationNotifier() {
  const { medications } = useMedical();
  const remindedRef = useRef<Set<string>>(new Set());

  useNotificationPolling(() => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const today = now.toISOString().slice(0, 10);

    medications.forEach((m) => {
      if (m.endDate && m.endDate < today) return;
      m.times.forEach((t) => {
        if (t !== hhmm) return;
        const key = `${m.id}-${t}-${today}`;
        if (remindedRef.current.has(key)) return;
        remindedRef.current.add(key);
        new Notification(`È ora di prendere ${m.name}`, { body: m.dosage || "Controlla la scheda Salute" });
      });
    });
  });

  return null;
}
