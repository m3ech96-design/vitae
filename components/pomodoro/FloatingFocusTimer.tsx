"use client";
import { useRouter, usePathname } from "next/navigation";
import { usePomodoro } from "@/lib/pomodoro-context";
import { FocusRunView } from "./FocusRunView";

/**
 * Persistente: resta visibile cambiando scheda finché una sessione è in corso, non solo
 * dentro /focus — così il ciclo di lavoro non si "perde di vista" continuando a fare altro
 * nell'app. Nascosto solo sulla pagina Focus stessa (dove c'è già la vista grande) e sulla
 * home/wizard, per lo stesso motivo per cui la barra di navigazione si nasconde lì (vedi
 * BottomNav.tsx) — un widget flottante sopra una schermata di autenticazione o benvenuto non
 * avrebbe alcun senso.
 *
 * Un `<div>` cliccabile invece di un `Link`: FocusRunView (in modalità compatta) contiene
 * già un proprio `<button>` per pausa/ripresa, e annidare un elemento interattivo dentro un
 * `<a>` è markup non valido — qui il pulsante interno ferma la propagazione del click, il
 * resto dell'area naviga verso /focus.
 */
export function FloatingFocusTimer() {
  const { activeRun } = usePomodoro();
  const pathname = usePathname();
  const router = useRouter();

  if (!activeRun) return null;
  if (pathname === "/" || pathname === "/wizard" || pathname.startsWith("/focus")) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push("/focus")}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && router.push("/focus")}
      className="focus-ring glass-nav fixed inset-x-4 z-30 block cursor-pointer rounded-xl3 px-4 py-3 shadow-glass"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)" }}
    >
      <FocusRunView compact />
    </div>
  );
}
