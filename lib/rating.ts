export function ratingLabel(value: number): string {
  if (value < 20) return "Pessimo";
  if (value < 40) return "Così così";
  if (value < 60) return "Nella media";
  if (value < 80) return "Buono";
  return "Adoro";
}

export function ratingStep(): number {
  return Math.round(5 + Math.random() * 5); // tra 5% e 10%, come da meccanica richiesta
}

export function ratingColor(value: number): string {
  if (value < 20) return "#FF6B9D";
  if (value < 40) return "#FFB454";
  if (value < 60) return "#5EC8FF";
  if (value < 80) return "#00E5C7";
  return "#34D399";
}
