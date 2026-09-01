"use client";
import { useEffect, useRef } from "react";
import { useMedical } from "@/lib/medical-context";

/**
 * Stessa meccanica di components/task/TaskNotifier.tsx, applicata agli orari dei farmaci:
 * un controllo ogni minuto, mentre l'app è aperta. Stesso limite onesto, mai nascosto — una
 * vera notifica push che arriva anche ad app chiusa richiederebbe un service worker con un
 * abbonamento push e un server dietro a inviarla, che questa app non ha (vedi la stessa nota
 * per la sincronizzazione con smartwatch/app di fitness in app/attivita-peso/page.tsx).
 */
export function MedicationNotifier() {
  const { medications } = useMedical();
  const remindedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const check = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
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
    };

    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [medications]);

  return null;
}
