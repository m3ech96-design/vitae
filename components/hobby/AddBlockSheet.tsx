"use client";
import { useState } from "react";
import { ListChecks, LineChart, Package, Hammer, Library, Swords } from "lucide-react";
import { useHobby } from "@/lib/hobby-context";
import { HobbyBlockKind, HOBBY_BLOCK_LABELS } from "@/lib/hobby-types";
import { PersonalCardSheet } from "../home/PersonalCardSheet";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

const KIND_META: { id: HobbyBlockKind; icon: typeof ListChecks; description: string }[] = [
  { id: "checklist", icon: ListChecks, description: "Fatto/da fare, note, foto" },
  { id: "metrica", icon: LineChart, description: "Un numero che segui nel tempo, con grafico e obiettivo" },
  { id: "inventario", icon: Package, description: "Oggetti posseduti, con valore e provenienza" },
  { id: "progetti", icon: Hammer, description: "Galleria di opere in corso o finite" },
  { id: "libreria", icon: Library, description: "Cose provate, lette o viste, con un voto" },
  { id: "partite", icon: Swords, description: "Partite giocate, con avversario e risultato" },
];

export function AddBlockSheet({ hobbyId, onClose }: { hobbyId: string; onClose: () => void }) {
  const { addBlock } = useHobby();
  const [kind, setKind] = useState<HobbyBlockKind | null>(null);
  const [title, setTitle] = useState("");

  const confirm = () => {
    if (!kind) return;
    addBlock(hobbyId, kind, title.trim() || HOBBY_BLOCK_LABELS[kind]);
    onClose();
  };

  return (
    <PersonalCardSheet title="Aggiungi blocco" onClose={onClose}>
      {!kind ? (
        <div className="space-y-2">
          {KIND_META.map(({ id, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => {
                setKind(id);
                setTitle(HOBBY_BLOCK_LABELS[id]);
              }}
              className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition hover:border-aura-violet/50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-aura-cyan">
                <Icon size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-ink-100">{HOBBY_BLOCK_LABELS[id]}</span>
                <span className="block text-[11px] text-ink-600">{description}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <TextField
            label="Nome del blocco"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            hint="Puoi rinominarlo in ogni momento, anche se aggiungi più blocchi dello stesso tipo"
          />
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1 justify-center" onClick={() => setKind(null)}>
              Indietro
            </Button>
            <Button className="flex-1 justify-center" onClick={confirm} disabled={!title.trim()}>
              Aggiungi
            </Button>
          </div>
        </div>
      )}
    </PersonalCardSheet>
  );
}
