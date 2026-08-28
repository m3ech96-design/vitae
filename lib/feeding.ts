import { Person } from "./types";

/** True se esiste un orario di pappa già passato oggi e non ancora seguito da un pasto registrato dopo di esso. */
export function isHungry(person: Person, now: Date = new Date()): boolean {
  if (person.feedingTimes.length === 0) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = now.toISOString().slice(0, 10);

  const lastMealToday = [...person.feedingLog]
    .filter((f) => f.date.slice(0, 10) === todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .pop();
  const lastMealMinutes = lastMealToday
    ? new Date(lastMealToday.date).getHours() * 60 + new Date(lastMealToday.date).getMinutes()
    : -1;

  return person.feedingTimes.some((f) => {
    const [h, m] = f.time.split(":").map(Number);
    const feedMinutes = h * 60 + m;
    return feedMinutes <= nowMinutes && feedMinutes > lastMealMinutes;
  });
}
