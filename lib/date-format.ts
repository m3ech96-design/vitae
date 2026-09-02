export function formatDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export function formatDateTime(dateIso: string, time?: string): string {
  const datePart = formatDateShort(dateIso);
  return time ? `${datePart} - ${time}` : datePart;
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysIso(baseIso: string, days: number): string {
  const d = new Date(baseIso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function weekdayShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("it-IT", { weekday: "short" }).replace(".", "");
}

/** "[anno nascita] - [anno morte]", entrambi in formato yyyy — quello che non conosci (o non
 * hai impostato) diventa "????", non uno spazio vuoto: non si nasconde mai un dato mancante,
 * lo si mostra com'è. Usata nella scheda della persona. */
export function lifespanLabel(birthday: string | undefined, deceasedYear: number | undefined): string {
  const birthYear = birthday ? String(new Date(birthday + "T00:00:00").getFullYear()) : "????";
  const deathYear = deceasedYear ? String(deceasedYear) : "????";
  return `${birthYear} - ${deathYear}`;
}
