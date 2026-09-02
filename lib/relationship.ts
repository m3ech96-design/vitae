import { Person, RelationshipAxis, RelationshipEvent } from "./types";
import { newId } from "./id";

/** Ogni interazione scritta vale sempre 3% — eliminato il concetto che potesse valere 1, 2 o
 * 3 a seconda della frase scelta (non esistono più frasi predefinite: vedi
 * InteractionComposer.tsx). `fixedDelta` resta per i pochi punti che applicano un incremento
 * diverso in automatico e non da un'interazione scritta dall'utente (es. dare da mangiare a
 * un animale, in HungryBadge.tsx). */
const WRITTEN_INTERACTION_DELTA = 3;

export interface InteractionResult {
  patch: Partial<Person>;
  event: RelationshipEvent;
}

export function applyInteraction(
  person: Person,
  label: string,
  positive: boolean,
  isPartner: boolean,
  fixedDelta?: number
): InteractionResult {
  const delta = fixedDelta ?? WRITTEN_INTERACTION_DELTA;
  let relationshipScore = person.relationshipScore;
  let trueFriendshipScore = person.trueFriendshipScore;
  let deepEnmityScore = person.deepEnmityScore;
  let loveScore = person.loveScore;
  let axis: RelationshipAxis = "base";

  if (positive) {
    if (trueFriendshipScore > 0 || relationshipScore >= 100) {
      trueFriendshipScore = Math.min(100, trueFriendshipScore + delta);
      relationshipScore = 100;
      axis = "true-friendship";
    } else if (deepEnmityScore > 0) {
      deepEnmityScore = Math.max(0, deepEnmityScore - delta);
      axis = "deep-enmity";
    } else {
      relationshipScore = Math.min(100, relationshipScore + delta);
    }
  } else {
    if (deepEnmityScore > 0 || relationshipScore <= -100) {
      deepEnmityScore = Math.min(100, deepEnmityScore + delta);
      relationshipScore = -100;
      axis = "deep-enmity";
    } else if (trueFriendshipScore > 0) {
      trueFriendshipScore = Math.max(0, trueFriendshipScore - delta);
      axis = "true-friendship";
    } else {
      relationshipScore = Math.max(-100, relationshipScore - delta);
    }
  }

  if (isPartner) {
    loveScore = Math.max(0, Math.min(100, loveScore + (positive ? delta : -delta)));
  }

  const event: RelationshipEvent = {
    id: newId(),
    date: new Date().toISOString(),
    label,
    delta: positive ? delta : -delta,
    axis,
  };

  return {
    patch: { relationshipScore, trueFriendshipScore, deepEnmityScore, loveScore },
    event,
  };
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Un'interazione scritta resta nella lista "recenti" per un giorno esatto dal momento in cui
 * è stata registrata, poi si deposita nella cronologia — come richiesto. Pura funzione di
 * data, nessun campo nuovo da salvare: lo stesso evento cambia elenco da solo, con il passare
 * del tempo. */
export function isRecentInteraction(event: RelationshipEvent, now: number = Date.now()): boolean {
  return now - new Date(event.date).getTime() < ONE_DAY_MS;
}

export function relationshipLabel(p: Person): string {
  if (p.trueFriendshipScore >= 100) return "Amicizia suprema";
  if (p.trueFriendshipScore > 0) return "Vera amicizia";
  if (p.deepEnmityScore >= 100) return "Inimicizia suprema";
  if (p.deepEnmityScore > 0) return "Profonda inimicizia";
  if (p.relationshipScore > 15) return "Amicizia";
  if (p.relationshipScore < -15) return "Inimicizia";
  return "Indifferenza";
}

export function relationshipColor(p: Person): string {
  if (p.trueFriendshipScore >= 100) return "#FFD86B";
  if (p.trueFriendshipScore > 0) return "#00E5C7";
  if (p.deepEnmityScore >= 100) return "#FF1F4B";
  if (p.deepEnmityScore > 0) return "#FF4D6D";
  if (p.relationshipScore > 15) return "#7C5CFF";
  if (p.relationshipScore < -15) return "#FF6B9D";
  return "#565B77";
}
