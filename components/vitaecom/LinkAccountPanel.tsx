"use client";
import { useState } from "react";
import { Link2, Sparkles } from "lucide-react";
import { useHousehold } from "@/lib/household-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { PersonPicker } from "@/components/ui/PersonPicker";
import { Person, CustomField } from "@/lib/types";
import { newId } from "@/lib/id";
import { applyInteraction } from "@/lib/relationship";
import { capArray } from "@/lib/cap-array";

/**
 * Solo per i tre account dimostrativi (vedi vitaecom-demo-data.ts) — non un generatore
 * casuale: poche righe scritte a mano, coerenti col personaggio già suggerito dai suoi post
 * d'esempio (Nina e il caffè lungo, Leo e la corsa, Sara e le foto vecchie), così chi
 * prova la funzione trova qualcosa che si legge come vero, non un segnaposto "Lorem Ipsum".
 */
const SAMPLE_PROFILES: Record<
  string,
  { firstName: string; kind: "uomo" | "donna"; occupation: string; identity: { label: string; value: string }[]; interactions: string[] }
> = {
  "demo-nina": {
    firstName: "Nina",
    kind: "donna",
    occupation: "Illustratrice freelance",
    identity: [
      { label: "Bevanda Del Mattino", value: "Caffè lungo, sempre" },
      { label: "Posto Preferito In Città", value: "Il tavolino vicino alla finestra del bar sotto casa" },
    ],
    interactions: ["Avete riso fino alle lacrime insieme", "Avete fatto una lunga passeggiata parlando di tutto"],
  },
  "demo-leo": {
    firstName: "Leo",
    kind: "uomo",
    occupation: "Personal trainer",
    identity: [
      { label: "Sport", value: "Corsa, tre volte a settimana" },
      { label: "Obiettivo Di Quest'Anno", value: "Finire la sua prima mezza maratona" },
    ],
    interactions: ["Hai festeggiato un suo successo come fosse tuo", "Avete cucinato insieme"],
  },
  "demo-sara": {
    firstName: "Sara",
    kind: "donna",
    occupation: "Archivista",
    identity: [
      { label: "Passione", value: "Fotografie vecchie e storie di famiglia" },
      { label: "Città Del Cuore", value: "Dove è cresciuta, non dove vive ora" },
    ],
    interactions: ["Hai ascoltato i suoi problemi senza giudicare", "Le hai scritto solo per dirle che ti mancava"],
  },
};

/**
 * "Esplora Altro" e "Ultime Scoperte" hanno bisogno di una Persona vera del tuo Mondo dietro
 * l'account per avere qualcosa di vero da mostrare — Scoperte, Rapporto e Albero sono TUOI
 * dati, non dati dell'account. Finché non colleghi nessuno, sono onestamente vuoti invece di
 * inventare qualcosa: stesso spirito dichiarato già usato per Chat e per il conteggio
 * nickname, applicato qui. La scorciatoia qui sotto NON viola questo principio: crea una
 * Persona vera e la marca `isDemo` (badge "Esempio" in Mondo, vedi PersonCard) — è sempre
 * una tua scelta esplicita col tocco, mai qualcosa che l'app inventa da sola all'avvio.
 */
export function LinkAccountPanel({ accountId, nickname }: { accountId: string; nickname: string }) {
  const { people, addPerson, updatePerson } = useHousehold();
  const { linkAccountToPerson } = useVitaecomSocial();
  const [creating, setCreating] = useState(false);
  const sample = SAMPLE_PROFILES[accountId];

  const createSamplePerson = () => {
    if (!sample) return;
    setCreating(true);
    const id = addPerson({ firstName: sample.firstName, lastName: "", kind: sample.kind, livesAtHome: false });

    // applyInteraction legge i punteggi correnti per decidere come muoverli — appena creata,
    // una Persona parte sempre da zero su tutti gli assi (vedi household-context.tsx
    // addPerson), quindi si può ricostruire lo stesso "prima" qui senza rileggerla dallo
    // stato React (che non sarebbe comunque ancora aggiornato in questo stesso giro).
    let scoreState: Pick<Person, "relationshipScore" | "trueFriendshipScore" | "deepEnmityScore" | "loveScore"> = {
      relationshipScore: 0,
      trueFriendshipScore: 0,
      deepEnmityScore: 0,
      loveScore: 0,
    };
    const history = sample.interactions.map((label) => {
      const { patch, event } = applyInteraction({ ...scoreState } as Person, label, true, false);
      scoreState = { ...scoreState, ...patch };
      return event;
    });

    const identityCustomFields: CustomField[] = sample.identity.map((f) => ({ id: newId(), label: f.label, value: f.value }));

    updatePerson(id, {
      ...scoreState,
      occupation: sample.occupation,
      identityCustomFields,
      relationshipHistory: capArray(history, 300),
      isDemo: true,
    });
    linkAccountToPerson(accountId, id);
  };

  return (
    <div className="rounded-xl2 border border-dashed border-white/15 p-5 text-center">
      <Link2 size={18} className="mx-auto text-ink-800" />
      <p className="mt-2.5 text-sm text-ink-200">Non hai ancora collegato @{nickname} a nessuna persona</p>
      <p className="mt-1 text-xs text-ink-800">
        Scoperte, Rapporto e Albero sono dati tuoi, sul tuo dispositivo — collega questo account alla persona vera che
        conosci per vederli qui.
      </p>
      <div className="mt-4 text-left">
        <PersonPicker
          label="Collega a"
          value={undefined}
          options={people}
          allowNone={false}
          onChange={(id) => id && linkAccountToPerson(accountId, id)}
        />
      </div>
      {people.length === 0 && (
        <p className="mt-2 text-[11px] text-ink-800">Non hai ancora creato nessuna persona in Mondo.</p>
      )}
      {sample && (
        <>
          <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-wide text-ink-800">
            <span className="h-px flex-1 bg-white/10" /> Oppure <span className="h-px flex-1 bg-white/10" />
          </div>
          <button
            onClick={createSamplePerson}
            disabled={creating}
            className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-xl2 border border-[#B79A6B]/40 bg-[#B79A6B]/[0.06] py-2.5 text-xs text-[#B79A6B] transition hover:bg-[#B79A6B]/[0.12] disabled:opacity-50"
          >
            <Sparkles size={13} /> Crea una persona di esempio per provare subito
          </button>
          <p className="mt-1.5 text-[10px] text-ink-800">
            Crea una vera persona in Mondo (marcata &quot;Esempio&quot;), già con qualche scoperta e un paio di
            interazioni — da cancellare quando vuoi.
          </p>
        </>
      )}
    </div>
  );
}

