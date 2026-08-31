export function isNightHour(date: Date = new Date()): boolean {
  const h = date.getHours();
  return h >= 22 || h < 6;
}

export function isAsleep(wakeUntil: string | undefined, now: Date = new Date()): boolean {
  if (!isNightHour(now)) return false;
  if (wakeUntil && new Date(wakeUntil).getTime() > now.getTime()) return false;
  return true;
}
