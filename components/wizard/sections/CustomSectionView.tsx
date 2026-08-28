"use client";
import { useState } from "react";
import { Pencil, Check } from "lucide-react";
import { CustomSection } from "@/lib/types";
import { capitalizeWords } from "@/lib/text";
import { DynamicFieldList } from "../DynamicFieldList";

export function CustomSectionView({
  section,
  onUpdate,
}: {
  section: CustomSection;
  onUpdate: (patch: Partial<CustomSection>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(section.title);

  const saveTitle = () => {
    const t = capitalizeWords(draftTitle.trim());
    if (t) onUpdate({ title: t });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
              className="focus-ring rounded-lg border border-aura-violet/40 bg-white/[0.04] px-2 py-1 font-display text-lg text-ink-100"
            />
            <button onClick={saveTitle} className="focus-ring text-aura-cyan" aria-label="Salva Nome Sezione">
              <Check size={16} />
            </button>
          </>
        ) : (
          <>
            <h3 className="font-display text-lg text-ink-100">{section.title}</h3>
            <button
              onClick={() => {
                setDraftTitle(section.title);
                setEditing(true);
              }}
              className="focus-ring text-ink-800 transition hover:text-ink-200"
              aria-label="Rinomina Sezione"
            >
              <Pencil size={13} />
            </button>
          </>
        )}
      </div>

      <DynamicFieldList
        fields={section.fields}
        onChange={(fields) => onUpdate({ fields })}
        allowThumbnail
      />
    </div>
  );
}
