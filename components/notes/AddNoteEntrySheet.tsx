"use client";
import { useState } from "react";
import { ListChecks, FileText } from "lucide-react";
import clsx from "clsx";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

export function AddNoteEntrySheet({
  onCreateList,
  onCreateNote,
  onClose,
}: {
  onCreateList: (title: string) => void;
  onCreateNote: (title: string) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<"list" | "note">("list");
  const [title, setTitle] = useState("");

  const submit = () => {
    const t = title.trim() || (kind === "list" ? "Nuova lista" : "Nuova nota");
    if (kind === "list") onCreateList(t);
    else onCreateNote(t);
    onClose();
  };

  return (
    <PersonalCardSheet title="Nuovo elemento" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-1.5">
          <button
            onClick={() => setKind("list")}
            className={clsx(
              "focus-ring flex flex-1 flex-col items-center gap-1.5 rounded-xl2 border px-3 py-3 text-center transition",
              kind === "list" ? "border-aura-violet/60 bg-aura-violet/10 text-ink-100" : "border-white/10 text-ink-600 hover:border-white/20"
            )}
          >
            <ListChecks size={17} />
            <span className="text-xs">Lista</span>
          </button>
          <button
            onClick={() => setKind("note")}
            className={clsx(
              "focus-ring flex flex-1 flex-col items-center gap-1.5 rounded-xl2 border px-3 py-3 text-center transition",
              kind === "note" ? "border-aura-violet/60 bg-aura-violet/10 text-ink-100" : "border-white/10 text-ink-600 hover:border-white/20"
            )}
          >
            <FileText size={17} />
            <span className="text-xs">Nota</span>
          </button>
        </div>

        <TextField
          label="Titolo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
          placeholder={kind === "list" ? "Es. Spesa, Da fare oggi..." : "Es. Idee, Appunti riunione..."}
        />

        <Button size="sm" className="w-full justify-center" onClick={submit}>
          Crea
        </Button>
      </div>
    </PersonalCardSheet>
  );
}
