"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Person, Task, Place } from "@/lib/types";
import { useProfile } from "@/lib/profile-context";
import { hashToUnit } from "@/lib/hash";
import { relationshipColor, relationshipLabel } from "@/lib/relationship";
import { totalOutings } from "@/lib/frequency";
import { toFamilyEntities } from "@/lib/family-entities";
import { connectedFamilyIds } from "@/lib/family-relations";
import { AuraAvatar } from "../ui/AuraAvatar";
import { RelationshipMedallion } from "./RelationshipMedallion";

interface ConstellationNode {
  person: Person;
  xPct: number;
  yPct: number;
  delay: number;
}

interface DustNode {
  id: string;
  xPct: number;
  yPct: number;
  color: string;
}

/**
 * Fasce di distanza nette (non un continuo) per l'intensità del legame — vedi sotto per
 * il perché del tetto ai singoli avatar individuali.
 */
const TIER_MIN_INTENSITY = [0.6, 0.3, 0.001, 0];

/**
 * Quante persone al massimo diventano un medaglione individuale, riconoscibile per nome e
 * foto. Non è un limite arbitrario: oltre questa soglia, centinaia di cerchi non stanno più
 * in un riquadro da telefono senza sovrapporsi comunque si distribuiscano (è geometria, non
 * calibrazione — vedi il "polverio" più sotto per cosa succede al resto). Le persone scelte
 * sono sempre quelle col legame più forte: chi ha centinaia di contatti ha comunque solo
 * poche decine di rapporti veri, il resto sono per lo più zero interazioni.
 */
const MAX_FEATURED = 20;

function intensityOf(p: Person): number {
  return Math.max(Math.abs(p.relationshipScore) / 100, p.trueFriendshipScore / 100, p.deepEnmityScore / 100);
}

function tierIndexFor(intensity: number): number {
  const idx = TIER_MIN_INTENSITY.findIndex((min) => intensity >= min);
  return idx === -1 ? TIER_MIN_INTENSITY.length - 1 : idx;
}

// Container più stretto che l'app supporta e frazione di larghezza che il raggio massimo
// di movimento occupa (vedi xPct/yPct sotto: distanza · 44) — la geometria è calcolata su
// questi due numeri, non a occhio, così vale su qualunque telefono, non solo su chi l'ha
// provata.
const CONTAINER_MIN_PX = 300;
const RADIUS_TO_CONTAINER = 0.44;
const SOLID_GAP_PX = 8;
const MAX_DUST_RENDERED = 220;

function pxToFraction(px: number): number {
  return px / CONTAINER_MIN_PX / RADIUS_TO_CONTAINER;
}

/**
 * Vista alternativa alla griglia di Rapporti: non un elenco, una scena. I legami più forti
 * (fino a MAX_FEATURED) diventano medaglioni individuali, raggruppati in fasce per quanto
 * siete legati — più forte il rapporto, più vicino, ogni fascia oltre l'ingombro reale
 * della precedente, mai sovrapposta. Tutti gli altri — potenzialmente centinaia, se ci sono
 * — diventano un polverio di puntini oltre l'ultima fascia: non individualmente
 * riconoscibili né toccabili (a quella densità non lo sarebbero comunque), ma la scena
 * resta leggibile invece di franare in un ammasso di cerchi sovrapposti. Un pulsante porta
 * alla griglia per sfogliarli tutti per nome.
 */
export function RelationshipConstellation({
  people,
  isPartnerId,
  tasks,
  places,
  onShowAll,
}: {
  people: Person[];
  isPartnerId: string | null;
  tasks: Task[];
  places: Place[];
  onShowAll: () => void;
}) {
  const { profile } = useProfile();
  const router = useRouter();

  const { nodes, dust, avatarSize, overflowCount } = useMemo(() => {
    // La Costellazione è un cielo di legami "scelti" (amicizie, inimicizie, quanto vi
    // frequentate) — i parenti hanno già la loro scena dedicata (l'Albero) e ci finiscono
    // comunque quasi tutti per definizione, affollando qui senza motivo; chi ti è del tutto
    // indifferente (vedi lib/relationship.ts) non ha nessun legame da mostrare in un cielo
    // che parla apposta di intensità.
    const familyIds = new Set(connectedFamilyIds("user", toFamilyEntities(profile, people)));
    const eligible = people.filter((p) => !familyIds.has(p.id) && relationshipLabel(p) !== "Indifferenza");

    // Chi entra tra i medaglioni individuali: prima per intensità del legame (le
    // interazioni che hai registrato in Rapporti), poi — a parità, il caso più comune,
    // dato che molte persone partono da punteggio zero — per quante volte frequenti
    // davvero questa persona (task e visite insieme), non per un id interno senza alcun
    // significato. A parità anche di questo, per nome: sempre qualcosa di leggibile, mai
    // arbitrario.
    const sorted = [...eligible].sort((a, b) => {
      const byIntensity = intensityOf(b) - intensityOf(a);
      if (byIntensity !== 0) return byIntensity;
      const byOutings = totalOutings(b.id, tasks, places) - totalOutings(a.id, tasks, places);
      if (byOutings !== 0) return byOutings;
      const byName = a.firstName.localeCompare(b.firstName, "it");
      return byName !== 0 ? byName : a.id.localeCompare(b.id);
    });
    const featured = sorted.slice(0, MAX_FEATURED);
    const overflow = sorted.slice(MAX_FEATURED);

    const byTier = new Map<number, Person[]>();
    featured.forEach((p) => {
      const tier = tierIndexFor(intensityOf(p));
      if (!byTier.has(tier)) byTier.set(tier, []);
      byTier.get(tier)!.push(p);
    });
    byTier.forEach((list) => list.sort((a, b) => a.firstName.localeCompare(b.firstName, "it") || a.id.localeCompare(b.id)));

    const maxTierSize = Math.max(0, ...[...byTier.values()].map((l) => l.length));
    const avatarSize =
      maxTierSize <= 6 ? 64 : maxTierSize <= 9 ? 52 : maxTierSize <= 13 ? 42 : 26;
    const userAvatarSize = Math.max(52, avatarSize);

    const ringGap = pxToFraction(avatarSize + SOLID_GAP_PX);
    const centerClearance = pxToFraction(userAvatarSize / 2 + avatarSize / 2 + SOLID_GAP_PX);

    const result: ConstellationNode[] = [];
    let floor = centerClearance;

    TIER_MIN_INTENSITY.forEach((_, tierIndex) => {
      const list = byTier.get(tierIndex);
      if (!list || list.length === 0) return;
      const n = list.length;
      // Geometria: per n punti equispaziati su un cerchio di raggio R, la corda tra due
      // punti adiacenti è 2R·sin(π/n) — imponendo che sia almeno ringGap si ricava il
      // raggio minimo perché non si tocchino, non scelto a occhio.
      const requiredForCrowding = n > 1 ? ringGap / (2 * Math.sin(Math.PI / n)) : 0;
      const ringRadius = Math.min(0.94, Math.max(floor, requiredForCrowding));
      const stagger = tierIndex % 2 === 0 ? 0 : 0.5;

      list.forEach((p, i) => {
        const angle = (2 * Math.PI * (i + stagger)) / n;
        const xPct = 50 + Math.cos(angle) * ringRadius * 44;
        const yPct = 50 + Math.sin(angle) * ringRadius * 44;
        const delay = -(hashToUnit(`${p.id}-drift`) * 5);
        result.push({ person: p, xPct, yPct, delay });
      });

      // La fascia successiva (legame più debole) deve stare oltre l'ingombro vero di
      // questa, non oltre la sua posizione "ideale" — altrimenti una fascia affollata
      // potrebbe finire più lontana della prossima e invertire l'ordine.
      floor = ringRadius + ringGap;
    });

    // Il polverio: chi resta fuori dai medaglioni individuali, oltre l'ultima fascia usata.
    // Puntini piccolissimi, posizione stabile (hash sull'id) ma senza pretesa di non
    // toccarsi — a questa densità sarebbe comunque impossibile, ed è proprio il punto: dice
    // "ce ne sono tanti altri", non pretende di farli riconoscere uno per uno.
    const dustFloor = Math.min(0.94, floor);
    const dust: DustNode[] = overflow.slice(0, MAX_DUST_RENDERED).map((p) => {
      const angle = hashToUnit(`${p.id}-dust-angle`) * Math.PI * 2;
      const r = dustFloor + hashToUnit(`${p.id}-dust-r`) * (0.97 - dustFloor);
      return {
        id: p.id,
        xPct: 50 + Math.cos(angle) * r * 44,
        yPct: 50 + Math.sin(angle) * r * 44,
        color: relationshipColor(p),
      };
    });

    return { nodes: result, dust, avatarSize, overflowCount: overflow.length };
  }, [people, tasks, places, profile]);

  const userAvatarSize = Math.max(52, avatarSize);

  return (
    <div>
      <div className="relative mx-auto aspect-square w-full max-w-[380px]">
        {/* Il cielo intero gira attorno a "Tu", lentissimo — non il tremore individuale di
           ogni punto (quello resta animate-drift, dentro). Ogni avatar contro-ruota alla
           stessa velocità per restare dritto: orbita, non gira su se stesso. */}
        <div className="absolute inset-0 animate-skySpin" style={{ transformOrigin: "50% 50%" }}>
          {dust.map((d) => (
            <span
              key={d.id}
              className="absolute h-1 w-1 rounded-full"
              style={{
                left: `${d.xPct}%`,
                top: `${d.yPct}%`,
                transform: "translate(-50%, -50%)",
                background: d.color,
                opacity: 0.55,
                boxShadow: `0 0 3px ${d.color}`,
              }}
              aria-hidden
            />
          ))}

          {nodes.map(({ person, xPct, yPct, delay }) => (
            <div
              key={person.id}
              className="absolute"
              style={{ left: `${xPct}%`, top: `${yPct}%`, transform: "translate(-50%, -50%)" }}
            >
              {/* Centratura statica sul wrapper esterno; contro-rotazione qui; drift
                 organico più dentro ancora — tre trasformazioni separate, mai sulla stessa
                 tappa, altrimenti l'una sovrascriverebbe l'altra invece di comporsi. */}
              <div className="animate-skySpinReverse">
                <div className="animate-drift" style={{ animationDelay: `${delay}s` }}>
                  <RelationshipMedallion
                    person={person}
                    isPartner={person.id === isPartnerId}
                    onOpen={() => router.push(`/rapporti/${person.id}`)}
                    size={avatarSize}
                    showLabel={false}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5">
          <AuraAvatar
            imageUrl={profile.avatarUrl}
            firstName={profile.firstName}
            lastName={profile.lastName}
            size={userAvatarSize}
            ring="home"
          />
          <span className="font-display text-[11px] text-ink-100">Tu</span>
        </div>
      </div>

      {overflowCount > 0 && (
        <button
          onClick={onShowAll}
          className="focus-ring mx-auto mt-5 flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs text-ink-600 hover:text-ink-200"
        >
          +{overflowCount} Altri Legami, Meno Vicini — Sfogliali Nella Griglia
        </button>
      )}
    </div>
  );
}
