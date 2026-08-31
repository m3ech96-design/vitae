const BASE_PULSE_SECONDS = 2.6;
const BASE_FLOAT_SECONDS = 4;
/** Centro della curva e ampiezza dell'oscillazione — 1.15 ± 0.35 dà un intervallo
 * 0.8 (mezzogiorno, respiro stretto) .. 1.5 (mezzanotte, respiro lungo). */
const MID = 1.15;
const AMPLITUDE = 0.35;

/**
 * Moltiplicatore del "respiro" (pulseSoft, float) in base all'ora del giorno — una singola
 * onda a coseno su 24 ore, più stretta (veloce) a mezzogiorno, più larga (lenta) verso sera
 * e nella notte. Non tocca `drift` (il tremore individuale di ogni punto) né `skySpin` (la
 * rotazione della Costellazione): quelli restano linguaggi di movimento separati, con un
 * significato diverso dal battito dell'app.
 */
export function dayRhythmMultiplier(now: Date = new Date()): number {
  const hour = now.getHours() + now.getMinutes() / 60;
  const wave = Math.cos((2 * Math.PI * (hour - 12)) / 24);
  return MID - AMPLITUDE * wave;
}

export function pulseDurationSeconds(now: Date = new Date()): number {
  return BASE_PULSE_SECONDS * dayRhythmMultiplier(now);
}

export function floatDurationSeconds(now: Date = new Date()): number {
  return BASE_FLOAT_SECONDS * dayRhythmMultiplier(now);
}
