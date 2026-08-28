"use client";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { pulseDurationSeconds } from "@/lib/day-rhythm";
import { FrayedRing } from "../illness/FrayedRing";

function initialsOf(first?: string, last?: string) {
  const a = (first || "").trim().charAt(0);
  const b = (last || "").trim().charAt(0);
  return (a + b).toLocaleUpperCase("it-IT") || "?";
}

export function AuraAvatar({
  imageUrl,
  firstName,
  lastName,
  size = 96,
  ring = "idle",
  shape = "circle",
  className,
  innerClassName,
  glowColor,
  glowIntensity,
  layoutId,
  deceased,
  illness,
  empty,
}: {
  imageUrl?: string;
  firstName?: string;
  lastName?: string;
  size?: number;
  ring?: "idle" | "home" | "away" | "sleep" | "world" | "none";
  /** "squircle" per gli animali: stessa tecnica del glow delle persone, forma diversa e
   * volutamente coerente con gli altri riquadri arrotondati dell'app (mai un cerchio perfetto,
   * mai uno spigolo vivo) — così si riconoscono a colpo d'occhio senza sembrare un'aggiunta a caso. */
  shape?: "circle" | "squircle";
  className?: string;
  /** Si applica al cerchio visibile vero e proprio (non al contenitore esterno più largo) — usalo per un bordo/anello che deve aderire perfettamente, come nelle pile di avatar sovrapposti. */
  innerClassName?: string;
  /** Colore identità personale (vedi lib/person-color.ts) che sostituisce il gradiente
   * generico dell'alone. Si applica solo se `ring` non è "none" — e va passato solo nei
   * contesti dove l'alone non ha già un significato di stato (Casa/Fuori Casa/Mondo restano
   * sempre i loro colori fissi, questa prop non li tocca mai). */
  glowColor?: string;
  /** 0..1 (vedi lib/aura-intensity.ts) — quanto è "vivo" l'alone di questa persona in base a
   * quanto tempo è passato dall'ultimo contatto reale. 1 = opacità e respiro normali;
   * scendendo, l'alone si affievolisce E rallenta il proprio battito, non solo si scurisce —
   * chi hai dimenticato si vede anche nel ritmo, non solo nel colore. Ha effetto solo insieme
   * a `glowColor`, mai sui ring di stato. */
  glowIntensity?: number;
  /** Quando due AuraAvatar in punti diversi dell'app condividono lo stesso layoutId (di
   * norma `person-avatar-${id}`), Framer Motion li tratta come lo stesso elemento visivo:
   * aprire il pannello di una persona lo fa "crescere" dalla sua icona in lista invece di
   * comparire sopra di netto — l'identità che resta continua, non un modale che si sovrappone. */
  layoutId?: string;
  /** Foto desaturata, e l'alone non pulsa più in continuo: si assesta una volta sola in una
   * quiete fioca, indipendente dal ring o dal colore identità passati — la desaturazione e
   * la fine del respiro bastano da sole, nessuna icona da lapide sopra. */
  deceased?: boolean;
  /** Bordo sfilacciato (vedi components/illness/FrayedRing.tsx) e una grana leggera sulla
   * foto — non tocca il bagliore dell'identità, quello resta il tuo colore: sei ammalato,
   * non sei un'altra persona. Solo per l'utente, per ora — non per le altre persone. */
  illness?: boolean;
  /** Avatar "vuoto" (vedi lib/unknown-relative.ts): esiste, ma non ha ancora un nome —
   * niente iniziali (non ce ne sono), niente alone identità: un contorno tratteggiato e un
   * "?" al centro, deliberatamente diverso da `deceased` — lì la persona è nota e mancata,
   * qui è viva e sconosciuta, in attesa di un nome. Torna un avatar normale da solo appena
   * `firstName`/`lastName` smettono di essere vuoti, senza altro stato da sincronizzare. */
  empty?: boolean;
}) {
  const resolvedUrl = useResolvedImage(imageUrl);
  const ringGradient =
    ring === "home"
      ? "from-aura-violet via-aura-cyan to-aura-violet"
      : ring === "away"
      ? "from-aura-amber via-aura-pink to-aura-amber"
      : ring === "sleep"
      ? "from-ink-800 via-ink-600 to-ink-800"
      : ring === "world"
      ? "from-aura-sky via-ink-400 to-aura-sky"
      : "from-aura-violet/70 via-aura-cyan/70 to-aura-violet/70";
  const radius = shape === "squircle" ? Math.round(size * 0.3) : undefined;
  const intensity = glowIntensity ?? 1;
  const hasCustomRhythm = glowColor !== undefined && glowIntensity !== undefined;

  return (
    <motion.div
      layoutId={layoutId}
      transition={layoutId ? { type: "spring", stiffness: 260, damping: 28 } : undefined}
      className={clsx("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* I defunti non hanno più alone: niente bagliore da spegnere, l'assenza è già il
         segno — restano solo la foto desaturata e il bordo fermo qui sotto (vedi anche
         `deceased` più giù, sul cerchio con la foto). */}
      {ring !== "none" && !deceased && !empty && (
        <span
          className={clsx(
            "absolute inset-0",
            !hasCustomRhythm && "animate-pulseSoft",
            !glowColor && "bg-gradient-to-tr",
            !glowColor && ringGradient,
            shape === "circle" && "rounded-full"
          )}
          style={{
            filter: "blur(6px)",
            borderRadius: radius,
            opacity: glowColor ? 0.65 * intensity : 0.65,
            ...(glowColor ? { background: `linear-gradient(135deg, ${glowColor}, ${glowColor}99, ${glowColor})` } : {}),
            // Chi hai dimenticato non solo si affievolisce, respira anche più piano —
            // un battito che rallenta, non solo una luce che si abbassa. Composto col
            // ritmo del giorno (lib/day-rhythm.ts), non al suo posto: a mezzanotte un
            // alone già fioco respira ancora più lento che a mezzogiorno.
            ...(hasCustomRhythm
              ? {
                  animationName: "pulseSoft",
                  animationDuration: `${(pulseDurationSeconds() / Math.max(0.15, intensity)).toFixed(2)}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                }
              : {}),
          }}
          aria-hidden
        />
      )}
      {/* Avatar vuoto: un contorno tratteggiato che respira piano, mai l'alone colorato
         dell'identità (non c'è ancora un'identità da colorare) e mai il fermo grigio del
         defunto (qui si è vivi, solo sconosciuti). */}
      {empty && (
        <span
          className={clsx("absolute inset-0 animate-pulseSoft", shape === "circle" && "rounded-full")}
          style={{
            borderRadius: radius,
            border: "2px dashed rgba(139,144,168,0.55)",
          }}
          aria-hidden
        />
      )}
      <div
        className={clsx(
          "relative overflow-hidden border flex items-center justify-center",
          empty ? "border-white/10 bg-white/[0.02]" : "border-white/15 bg-void-700",
          shape === "circle" && "rounded-full",
          innerClassName
        )}
        style={{ width: size - 8, height: size - 8, margin: 4, borderRadius: radius }}
      >
        {resolvedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedUrl}
            alt=""
            className={clsx("h-full w-full object-cover", deceased && "grayscale contrast-90 brightness-90")}
          />
        ) : empty ? (
          <span className="font-display text-ink-800" style={{ fontSize: Math.max(15, size * 0.34) }}>
            ?
          </span>
        ) : (
          <span
            className="font-display font-semibold text-ink-100"
            style={{ fontSize: Math.max(14, size * 0.32) }}
          >
            {initialsOf(firstName, lastName)}
          </span>
        )}
        {illness && <span className="illness-grain" />}
      </div>
      {/* Bordo sfilacciato dell'identità malata: più caldo e un filo più marcato di un
         semplice grigio, così si legge a colpo d'occhio anche senza la scritta "Non Ti
         Senti Bene?" sulla card (rimossa) — l'unico posto in cui questo effetto resta ora
         è proprio qui, intorno all'avatar. */}
      {illness && (
        <span
          className="absolute inset-0 animate-pulseSoft"
          style={{ borderRadius: shape === "circle" ? "9999px" : radius, opacity: 0.9 }}
          aria-hidden
        >
          <FrayedRing shape={shape === "squircle" ? "rect" : "circle"} radius={radius} />
        </span>
      )}
      {ring === "sleep" && (
        <span className="absolute -top-1 -right-1 rounded-full bg-void-800 border border-white/10 px-1.5 text-[10px] text-ink-400 animate-float">
          Zzz
        </span>
      )}
    </motion.div>
  );
}
