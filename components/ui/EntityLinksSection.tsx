"use client";
import { useState } from "react";
import { Link2, Plus } from "lucide-react";
import { EntityLink } from "@/lib/entity-link";
import { useEntityResolver } from "@/lib/entity-resolver";
import { EntityLinkCard } from "./EntityLinkCard";
import { EntityLinkPickerSheet } from "./EntityLinkPickerSheet";

/**
 * Sezione "Collegamenti" completa (etichetta, elenco di card, pulsante aggiungi, sheet di
 * ricerca) — stessa identica UI ovunque il collegamento generico compaia (Liste e note,
 * Diario), una sola implementazione invece di ricostruirla uguale in ogni pagina che la usa.
 */
export function EntityLinksSection({
  links,
  onAdd,
  onRemove,
}: {
  links: EntityLink[];
  onAdd: (link: EntityLink) => void;
  onRemove: (link: EntityLink) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { resolve } = useEntityResolver();

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-600">
          <Link2 size={12} /> Collegamenti
        </p>
        <button
          onClick={() => setPickerOpen(true)}
          className="focus-ring flex items-center gap-1 rounded-full border border-dashed border-white/15 px-2.5 py-1 text-[11px] text-ink-600 hover:text-ink-200"
        >
          <Plus size={11} /> Collega
        </button>
      </div>

      {links.length === 0 ? (
        <p className="text-xs text-ink-800">Nessun collegamento ancora.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {links.map((link) => (
            <EntityLinkCard key={`${link.type}-${link.id}`} entity={resolve(link)} onRemove={() => onRemove(link)} />
          ))}
        </div>
      )}

      {pickerOpen && <EntityLinkPickerSheet existingLinks={links} onAdd={onAdd} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
