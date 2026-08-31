import { MoodDefinition } from "./mood-catalog";

/**
 * Un colore acceso (giallo, rosa) buttato in piena opacità su un fondo quasi nero stona —
 * lo si vede a colpo d'occhio. Invece di un solo gradiente colore→trasparente uguale per
 * tutti, ogni "tono" (vedi MoodTone in mood-catalog.ts) riceve un trattamento diverso:
 * - "vivido": tenuto più basso e con uno stop intermedio semitrasparente (non salta dritto
 *   al trasparente), così il colore si smorza dentro il buio invece di restarci sopra di netto.
 * - "delicato": quasi invariato, sono già toni tenui che si intonano da soli allo sfondo scuro.
 * - "cupo"/"pesante": una seconda ombra scura sovrapposta, più ampia e diffusa — un
 *   'peso' visivo che vivido e delicato non hanno, coerente con cosa raccontano quegli stati.
 */
export function moodBackgroundLayers(mood: MoodDefinition, intensity: number): string[] {
  const tone = mood.tone ?? "vivido";
  const i = Math.max(0, Math.min(1, intensity));

  switch (tone) {
    case "delicato":
      return [`radial-gradient(circle at 15% 20%, ${mood.color}, transparent 65%)`];

    case "vivido":
      return [
        `radial-gradient(circle at 15% 20%, ${mood.color}cc, ${mood.color}22 42%, transparent 68%)`,
      ];

    case "cupo":
      return [
        `radial-gradient(circle at 15% 20%, ${mood.color}, transparent 60%)`,
        `radial-gradient(circle at 80% 100%, rgba(4,5,10,${0.5 * i}), transparent 70%)`,
      ];

    case "pesante":
      return [
        `radial-gradient(circle at 20% 30%, ${mood.color}, transparent 75%)`,
        `radial-gradient(circle at 85% 90%, rgba(4,5,10,${0.6 * i}), transparent 80%)`,
      ];
  }
}

/** Opacità base del layer colore, prima di moltiplicarla per l'intensità dello stato —
 * "vivido" parte più basso apposta (il colore è già forte da solo), "pesante" più basso
 * ancora (è uno stato spento, non deve mai diventare il layer più marcato della card). */
export function moodBackgroundOpacity(mood: MoodDefinition): number {
  const tone = mood.tone ?? "vivido";
  if (tone === "vivido") return 0.13;
  if (tone === "cupo") return 0.15;
  if (tone === "pesante") return 0.1;
  return 0.16; // delicato
}
