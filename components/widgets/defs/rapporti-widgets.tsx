"use client";
import { Cake, Heart, Globe2, Clock3 } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { useTasks } from "@/lib/tasks-context";
import { usePlaces } from "@/lib/places-context";
import { ANIMAL_KINDS } from "@/lib/types";
import { relationshipLabel } from "@/lib/relationship";
import { personWorldStatus } from "@/lib/task-presence";
import { currentEngagement } from "@/lib/presence";
import { WidgetList, WidgetStat, WidgetEmpty } from "../primitives";
import { WidgetSize } from "@/lib/widgets/types";

function daysUntilNextBirthday(birthday: string, today: Date): number {
  const [, m, d] = birthday.split("-").map(Number);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

export function UpcomingBirthdaysWidget({ size }: { size: WidgetSize }) {
  const { people } = useHousehold();
  const today = new Date();
  const items = people
    .filter((p) => p.birthday && !ANIMAL_KINDS.includes(p.kind))
    .map((p) => ({ person: p, days: daysUntilNextBirthday(p.birthday as string, today) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 3)
    .map((x) => ({
      id: x.person.id,
      label: `${x.person.firstName} ${x.person.lastName}`.trim(),
      meta: x.days === 0 ? "Oggi!" : `tra ${x.days}g`,
      color: x.days === 0 ? "#FF6B9D" : "#8B90A8",
    }));

  return <WidgetList title="Compleanni in arrivo" icon={Cake} items={items} emptyLabel="Nessun compleanno impostato" />;
}

export function TodayBirthdayWidget({ size }: { size: WidgetSize }) {
  const { people } = useHousehold();
  const today = new Date();
  const person = people.find((p) => {
    if (!p.birthday || ANIMAL_KINDS.includes(p.kind)) return false;
    const [, m, d] = p.birthday.split("-").map(Number);
    return m - 1 === today.getMonth() && d === today.getDate();
  });
  if (!person) return <WidgetEmpty icon={Cake} label="Nessun compleanno oggi" />;
  return <WidgetStat icon={Cake} value={`${person.firstName} ${person.lastName}`.trim()} label="Compleanno oggi!" color="#FF6B9D" />;
}

export function NextBirthdayCountdownWidget({ size }: { size: WidgetSize }) {
  const { people } = useHousehold();
  const today = new Date();
  const withDays = people
    .filter((p) => p.birthday && !ANIMAL_KINDS.includes(p.kind))
    .map((p) => ({ person: p, days: daysUntilNextBirthday(p.birthday as string, today) }));
  const next = withDays.sort((a, b) => a.days - b.days)[0];
  if (!next) return <WidgetEmpty icon={Cake} label="Nessun compleanno impostato" />;
  return (
    <WidgetStat
      icon={Cake}
      value={next.days === 0 ? "Oggi!" : `${next.days}g`}
      label={`${next.person.firstName} ${next.person.lastName}`.trim()}
      color={next.days === 0 ? "#FF6B9D" : "#8B90A8"}
    />
  );
}

export function StrongestBondWidget({ size }: { size: WidgetSize }) {
  const { people } = useHousehold();
  const humans = people.filter((p) => !ANIMAL_KINDS.includes(p.kind));
  const top = [...humans].sort((a, b) => b.trueFriendshipScore - a.trueFriendshipScore)[0];
  if (!top || top.trueFriendshipScore <= 0) return <WidgetEmpty icon={Heart} label="Nessun legame forte ancora" />;
  return <WidgetStat icon={Heart} value={`${top.firstName} ${top.lastName}`.trim()} label={relationshipLabel(top)} color="#FFD86B" />;
}

export function PeopleInWorldNowWidget({ size }: { size: WidgetSize }) {
  const { people, home } = useHousehold();
  const { tasks } = useTasks();
  const { places } = usePlaces();
  const humans = people.filter((p) => !ANIMAL_KINDS.includes(p.kind));
  const count = humans.filter((p) => {
    const eng = currentEngagement(p);
    const engPlaceId = eng?.linkedPlaceId ? places.find((pl) => pl.id === eng.linkedPlaceId)?.id ?? null : null;
    return personWorldStatus(p, tasks, home?.placeId, engPlaceId) === "mondo";
  }).length;
  return <WidgetStat icon={Globe2} value={count} label={count === 1 ? "Persona nel mondo ora" : "Persone nel mondo ora"} color="#5EC8FF" />;
}

export function NotContactedWidget({ size }: { size: WidgetSize }) {
  const { people } = useHousehold();
  const humans = people.filter((p) => !ANIMAL_KINDS.includes(p.kind) && p.relationshipHistory.length > 0);
  const withLast = humans.map((p) => ({
    person: p,
    lastDate: [...p.relationshipHistory].sort((a, b) => b.date.localeCompare(a.date))[0].date,
  }));
  const oldest = withLast.sort((a, b) => a.lastDate.localeCompare(b.lastDate))[0];
  if (!oldest) return <WidgetEmpty icon={Clock3} label="Nessuna interazione ancora registrata" />;
  const days = Math.round((Date.now() - new Date(oldest.lastDate).getTime()) / 86_400_000);
  return <WidgetStat icon={Clock3} value={`${oldest.person.firstName}`} label={`Non senti da ${days} giorni`} color="#8B90A8" />;
}
