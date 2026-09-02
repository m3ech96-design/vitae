"use client";
import { PawPrint, Syringe, Scale, Calendar, Pill } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { useAnimalHealth } from "@/lib/animal-health-context";
import { ANIMAL_KINDS } from "@/lib/types";
import { isHungry } from "@/lib/feeding";
import { todayIso } from "@/lib/date-format";
import { WidgetStat, WidgetEmpty, WidgetList } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

export function NextMealWidget({ size }: { size: WidgetSize }) {
  const { people } = useHousehold();
  const animals = people.filter((p) => ANIMAL_KINDS.includes(p.kind));
  const hungry = animals.find((a) => isHungry(a));
  if (!hungry) return <WidgetEmpty icon={PawPrint} label="Nessuno ha fame ora" />;
  return <WidgetStat icon={PawPrint} value={hungry.firstName} label="Ha fame ora" color="#FFB454" />;
}

export function NextVaccinationWidget({ size }: { size: WidgetSize }) {
  const { people } = useHousehold();
  const { vaccinations } = useAnimalHealth();
  const today = todayIso();
  const due = [...vaccinations]
    .filter((v) => v.nextDueDate)
    .sort((a, b) => (a.nextDueDate as string).localeCompare(b.nextDueDate as string))[0];
  if (!due) return <WidgetEmpty icon={Syringe} label="Nessun vaccino in programma" />;
  const animal = people.find((p) => p.id === due.animalId);
  const overdue = (due.nextDueDate as string) <= today;
  return (
    <WidgetStat
      icon={Syringe}
      value={due.name}
      label={`${animal?.firstName ?? "?"} · ${due.nextDueDate}`}
      color={overdue ? "#FF4D6D" : "#8B90A8"}
    />
  );
}

export function AnimalWeightTrendWidget({ size }: { size: WidgetSize }) {
  const { people } = useHousehold();
  const { weightEntries } = useAnimalHealth();
  const animals = people.filter((p) => ANIMAL_KINDS.includes(p.kind));
  for (const a of animals) {
    const entries = weightEntries.filter((w) => w.animalId === a.id).sort((x, y) => y.date.localeCompare(x.date));
    if (entries.length > 0) {
      const delta = entries.length > 1 ? entries[0].value - entries[1].value : 0;
      return (
        <WidgetStat
          icon={Scale}
          value={`${entries[0].value}kg`}
          label={a.firstName}
          color={delta > 0 ? "#FF6B9D" : delta < 0 ? "#34D399" : "#8B90A8"}
          sub={entries.length > 1 ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}kg` : undefined}
        />
      );
    }
  }
  return <WidgetEmpty icon={Scale} label="Nessuna pesata registrata" />;
}

export function DaysSinceAdoptionWidget({ size }: { size: WidgetSize }) {
  const { people } = useHousehold();
  const animal = people.find((p) => ANIMAL_KINDS.includes(p.kind) && p.birthOrAdoptionDate);
  if (!animal) return <WidgetEmpty icon={Calendar} label="Nessuna data impostata" />;
  const days = Math.round((Date.now() - new Date(animal.birthOrAdoptionDate as string).getTime()) / 86_400_000);
  return <WidgetStat icon={Calendar} value={days} label={`Giorni con ${animal.firstName}`} color="#B79A6B" />;
}

export function AnimalMedicationsWidget({ size }: { size: WidgetSize }) {
  const { people } = useHousehold();
  const { medications } = useAnimalHealth();
  const today = todayIso();
  const ongoing = medications.filter((m) => !m.endDate || m.endDate >= today);
  const items = ongoing.slice(0, 4).map((m) => {
    const animal = people.find((p) => p.id === m.animalId);
    return { id: m.id, label: m.name, meta: animal?.firstName };
  });
  return <WidgetList title="Farmaci in corso" icon={Pill} items={items} emptyLabel="Nessun farmaco in corso" />;
}
