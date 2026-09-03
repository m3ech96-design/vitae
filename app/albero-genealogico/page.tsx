"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, GitBranch } from "lucide-react";
import { useGenealogy } from "@/lib/genealogy-context";
import { genealogyFullName } from "@/lib/genealogy-format";
import { isEmptyAvatar } from "@/lib/unknown-relative";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { GenealogyFamilyModal } from "@/components/genealogia/GenealogyFamilyModal";
import { GenealogyFamily } from "@/lib/genealogy-types";

function FamilyCard({
  family,
  onOpen,
  onEdit,
  onDelete,
}: {
  family: GenealogyFamily;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { people } = useGenealogy();
  const reference = people.find((p) => p.id === family.referencePersonId);
  const avatarUrl = useResolvedImage(reference?.avatarKey);

  return (
    <GlassCard className="flex items-center gap-3 p-4">
      <button onClick={onOpen} className="focus-ring flex min-w-0 flex-1 items-center gap-3 text-left">
        <AuraAvatar
          imageUrl={avatarUrl}
          firstName={reference?.firstName}
          lastName={reference?.lastName}
          size={48}
          ring="idle"
          empty={reference ? isEmptyAvatar(reference) : false}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm text-ink-100">{family.name}</p>
          <p className="truncate text-xs text-ink-600">
            {reference ? `Da ${genealogyFullName(reference)}` : "Nessuna persona di riferimento"}
          </p>
        </div>
      </button>
      <button onClick={onEdit} className="focus-ring shrink-0 text-ink-600 hover:text-ink-200" aria-label="Rinomina famiglia">
        <Pencil size={14} />
      </button>
      <button onClick={onDelete} className="focus-ring shrink-0 text-ink-600 hover:text-aura-pink" aria-label="Elimina famiglia">
        <Trash2 size={14} />
      </button>
    </GlassCard>
  );
}

export default function GenealogyFamiliesPage() {
  const router = useRouter();
  const { hydrated, families, removeFamily } = useGenealogy();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<GenealogyFamily | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!hydrated) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.28em] text-ink-600">
            <GitBranch size={12} /> Albero genealogico
          </p>
          <h1 className="mt-1 font-display text-2xl text-ink-100">Le tue famiglie</h1>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-aura-gradient text-void-950 shadow-glow"
          aria-label="Nuova famiglia"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {families.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-white/10 py-14 text-center">
            <GitBranch size={20} className="text-ink-800" />
            <p className="text-sm text-ink-600">Ancora nessuna famiglia. Creane una per iniziare.</p>
          </div>
        ) : (
          families.map((f) => (
            <FamilyCard
              key={f.id}
              family={f}
              onOpen={() => router.push(`/albero-genealogico/persona/${f.referencePersonId}`)}
              onEdit={() => setEditingFamily(f)}
              onDelete={() => setConfirmDeleteId(f.id)}
            />
          ))
        )}
      </div>

      {modalOpen && <GenealogyFamilyModal onClose={() => setModalOpen(false)} />}
      {editingFamily && <GenealogyFamilyModal family={editingFamily} onClose={() => setEditingFamily(null)} />}
      {confirmDeleteId && (
        <ConfirmDialog
          title="Eliminare questa famiglia?"
          description="Solo il segnalibro viene rimosso — le persone e le relazioni restano intatte."
          onConfirm={() => {
            removeFamily(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
