/**
 * 50 toni "gioiello" distribuiti con l'angolo aureo (137.508°):
 * una palette curata e armoniosa invece della solita ruota arcobaleno lineare.
 */
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export const TASK_COLORS: string[] = Array.from({ length: 50 }, (_, i) =>
  hslToHex((i * 137.508) % 360, 66, 60)
);
