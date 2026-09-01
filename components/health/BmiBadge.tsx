"use client";
import { useProfile } from "@/lib/profile-context";

/** BMI = peso (kg) / altezza (m)^2 — solo se l'altezza è già impostata nel wizard
 * (Corpo): non la chiediamo di nuovo qui, il dato o c'è già o non si mostra nulla. */
function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Sottopeso", color: "#5EC8FF" };
  if (bmi < 25) return { label: "Normopeso", color: "#34D399" };
  if (bmi < 30) return { label: "Sovrappeso", color: "#FFB454" };
  return { label: "Obesità", color: "#FF6B9D" };
}

export function BmiBadge({ weightKg }: { weightKg?: number }) {
  const { profile } = useProfile();
  const heightM = profile.height ? profile.height / 100 : undefined;

  if (!weightKg || !heightM) return null;

  const bmi = weightKg / (heightM * heightM);
  const cat = bmiCategory(bmi);

  return (
    <p className="mt-1 text-xs" style={{ color: cat.color }}>
      BMI {bmi.toFixed(1)} · {cat.label}
    </p>
  );
}
