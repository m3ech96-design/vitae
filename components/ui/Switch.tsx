"use client";

/**
 * Interruttore a scorrimento — prima la stessa coppia "traccia + pallina" era scritta a mano
 * in cinque punti diversi dell'app (Vive Con Te e Defunto/a in AddPersonModal, Condividi
 * Stato D'Animo Su Vitaecom in due punti), sempre con lo stesso difetto: la pallina si
 * spostava con un `translate-x` calcolato sulla sua posizione "naturale" nel flusso invece
 * che con `position: absolute` ancorata alla traccia — bastava un padding o un bordo di
 * default del contenitore (un `<button>` non azzerato, per esempio) per farla scivolare
 * fuori posto rispetto alla cornice. Qui la pallina è sempre `absolute` dentro una traccia
 * `relative`, indipendente da cos'altro la circonda.
 */
function trackClass(checked: boolean, tone: "violet" | "ink") {
  return `relative h-5 w-9 shrink-0 rounded-full transition-colors ${
    checked ? (tone === "ink" ? "bg-ink-600" : "bg-aura-violet") : "bg-white/10"
  }`;
}

function Thumb({ checked }: { checked: boolean }) {
  return (
    <span
      className={`absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white transition-transform ${
        checked ? "translate-x-4" : "translate-x-0"
      }`}
      aria-hidden
    />
  );
}

/** Interruttore autonomo, con la sua semantica di bottone — usalo quando il tocco deve
 * riguardare solo l'interruttore, non un'intera riga che fa già altro al click. */
export function Switch({
  checked,
  onChange,
  tone = "violet",
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  tone?: "violet" | "ink";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`focus-ring border-0 p-0 disabled:opacity-50 ${trackClass(checked, tone)}`}
    >
      <Thumb checked={checked} />
    </button>
  );
}

/** Solo il disegno — nessuna semantica di bottone — per una riga che è GIÀ un bottone (tutta
 * la riga è cliccabile): un bottone dentro un altro bottone non è HTML valido, lo stesso bug
 * già corretto altrove in questo progetto (vedi PersonalCardMenu, PersonCard). */
export function SwitchVisual({ checked, tone = "violet" }: { checked: boolean; tone?: "violet" | "ink" }) {
  return (
    <span className={trackClass(checked, tone)}>
      <Thumb checked={checked} />
    </span>
  );
}
