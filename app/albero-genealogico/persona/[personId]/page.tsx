"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Plus, Settings2, Users } from "lucide-react";
import { useGenealogy } from "@/lib/genealogy-context";
import { genealogyFullName } from "@/lib/genealogy-format";
import { GenealogyTreeCanvas } from "@/components/genealogia/GenealogyTreeCanvas";
import { GenealogyPersonSheet } from "@/components/genealogia/GenealogyPersonSheet";
import { GenealogyRelationshipModal } from "@/components/genealogia/GenealogyRelationshipModal";
import { GenealogyTypeSettingsSheet } from "@/components/genealogia/GenealogyTypeSettingsSheet";

/**
 * L'albero vero e proprio, centrato su `personId`. Punto 11 delle istruzioni (non perdere il
 * contesto di navigazione quando si apre l'albero di una persona esterna): il percorso
 * percorso finora vive nella query `?path=id1,id2,...` — un vero URL navigabile, non uno
 * stato interno che sparisce se si ricarica la pagina o si condivide il link. "Apri il suo
 * albero" (in GenealogyPersonSheet) accoda la persona attuale al percorso; ogni tappa del
 * breadcrumb qui sotto torna a quel punto del percorso troncandolo lì.
 */
export default function GenealogyTreePage({ params }: { params: { personId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hydrated, people } = useGenealogy();
  const [openPersonId, setOpenPersonId] = useState<string | null>(null);
  const [addingRelationship, setAddingRelationship] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pathIds = (searchParams.get("path") ?? "").split(",").filter(Boolean);
  const trail = [...pathIds, params.personId];

  const openTree = (nextPersonId: string) => {
    const nextPath = trail.join(",");
    router.push(`/albero-genealogico/persona/${nextPersonId}?path=${encodeURIComponent(nextPath)}`);
  };

  const goToTrailIndex = (index: number) => {
    if (index === trail.length - 1) return;
    const targetId = trail[index];
    const newPath = trail.slice(0, index).join(",");
    router.push(`/albero-genealogico/persona/${targetId}${newPath ? `?path=${encodeURIComponent(newPath)}` : ""}`);
  };

  if (!hydrated) return null;

  const referencePerson = people.find((p) => p.id === params.personId);

  if (!referencePerson) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-600">Questa persona non esiste più.</p>
        <button onClick={() => router.push("/albero-genealogico")} className="focus-ring mt-4 text-sm text-aura-cyan">
          Torna alle famiglie
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-void-950">
      <div className="glass-strong z-10 flex items-center gap-2 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.9rem)]">
        <button
          onClick={() => (trail.length > 1 ? goToTrailIndex(trail.length - 2) : router.push("/albero-genealogico"))}
          className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50"
          aria-label="Indietro"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {trail.map((id, i) => {
            const p = people.find((x) => x.id === id);
            if (!p) return null;
            const isLast = i === trail.length - 1;
            return (
              <span key={id} className="flex shrink-0 items-center gap-1">
                {i > 0 && <ChevronRight size={12} className="shrink-0 text-ink-800" />}
                <button
                  onClick={() => goToTrailIndex(i)}
                  className={`focus-ring shrink-0 truncate rounded-full px-2.5 py-1 text-xs ${
                    isLast ? "bg-aura-violet/15 text-ink-100" : "text-ink-600 hover:text-ink-200"
                  }`}
                >
                  {genealogyFullName(p)}
                </button>
              </span>
            );
          })}
        </div>

        <button
          onClick={() => router.push("/albero-genealogico")}
          className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50"
          aria-label="Famiglie"
        >
          <Users size={16} />
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50"
          aria-label="Impostazioni albero"
        >
          <Settings2 size={16} />
        </button>
      </div>

      <div className="relative flex-1">
        <GenealogyTreeCanvas referencePersonId={params.personId} onOpenPerson={setOpenPersonId} />

        <button
          onClick={() => setAddingRelationship(true)}
          className="focus-ring absolute bottom-[max(env(safe-area-inset-bottom),16px)] left-4 flex h-11 items-center gap-1.5 rounded-full bg-aura-gradient px-4 text-sm font-display text-void-950 shadow-glow"
        >
          <Plus size={16} /> Aggiungi persona
        </button>
      </div>

      {openPersonId && (
        <GenealogyPersonSheet
          personId={openPersonId}
          isReference={openPersonId === params.personId}
          onClose={() => setOpenPersonId(null)}
          onOpenTree={(id) => {
            setOpenPersonId(null);
            openTree(id);
          }}
        />
      )}

      {addingRelationship && (
        <GenealogyRelationshipModal anchorPersonId={params.personId} onClose={() => setAddingRelationship(false)} />
      )}

      {settingsOpen && <GenealogyTypeSettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
