/**
 * Ogni frase inserita nell'app deve avere obbligatoriamente
 * la lettera maiuscola a inizio parola (regola richiesta per l'intera app).
 */
export function capitalizeWords(input: string): string {
  if (!input) return input;
  return input
    .split(" ")
    .map((word) =>
      word.length === 0
        ? word
        : word.charAt(0).toLocaleUpperCase("it-IT") + word.slice(1)
    )
    .join(" ");
}

export function capitalizeSentence(input: string): string {
  if (!input) return input;
  const trimmed = input.trimStart();
  if (!trimmed) return input;
  return trimmed.charAt(0).toLocaleUpperCase("it-IT") + trimmed.slice(1);
}

export function lowercaseFirst(input: string): string {
  if (!input) return input;
  const trimmed = input.trimStart();
  if (!trimmed) return input;
  return trimmed.charAt(0).toLocaleLowerCase("it-IT") + trimmed.slice(1);
}

export function computeAge(isoDate: string | undefined): number | null {
  if (!isoDate) return null;
  const birth = new Date(isoDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
