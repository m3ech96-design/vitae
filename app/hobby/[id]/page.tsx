"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Plus } from "lucide-react";
import { useHobby } from "@/lib/hobby-context";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { AddHobbyModal } from "@/components/hobby/AddHobbyModal";
import { AddBlockSheet } from "@/components/hobby/AddBlockSheet";
import { ChecklistBlockView } from "@/components/hobby/ChecklistBlockView";
import { MetricBlockView } from "@/components/hobby/MetricBlockView";
import { InventoryBlockView } from "@/components/hobby/InventoryBlockView";
import { ProjectsBlockView } from "@/components/hobby/ProjectsBlockView";
import { LibraryBlockView } from "@/components/hobby/LibraryBlockView";
import { MatchesBlockView } from "@/components/hobby/MatchesBlockView";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

function CoverPhoto({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

export default function HobbyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { hydrated, hobbies, removeHobby } = useHobby();
  const [editOpen, setEditOpen] = useState(false);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!hydrated) return null;

  const hobby = hobbies.find((h) => h.id === params.id);
  if (!hobby) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-600">Questo hobby non esiste più.</p>
        <button onClick={() => router.push("/hobby")} className="focus-ring mt-4 text-sm text-aura-cyan">
          Torna agli hobby
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/hobby")} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50" aria-label="Torna agli hobby">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditOpen(true)} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-violet/50" aria-label="Modifica hobby">
            <Pencil size={14} />
          </button>
          <button onClick={() => setConfirmDelete(true)} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-300 hover:border-aura-pink/50" aria-label="Elimina hobby">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {hobby.photoKey && (
        <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl3">
          <CoverPhoto photoKey={hobby.photoKey} />
        </div>
      )}

      <h1 className="mt-4 font-display text-2xl text-ink-100">{hobby.name}</h1>

      {hobby.details.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hobby.details.map((d) => (
            <span key={d.id} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-ink-300">
              <span className="text-ink-600">{d.label}:</span> {d.value}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {hobby.blocks.map((block) => {
          switch (block.kind) {
            case "checklist":
              return <ChecklistBlockView key={block.id} hobbyId={hobby.id} block={block} />;
            case "metrica":
              return <MetricBlockView key={block.id} hobbyId={hobby.id} block={block} />;
            case "inventario":
              return <InventoryBlockView key={block.id} hobbyId={hobby.id} block={block} />;
            case "progetti":
              return <ProjectsBlockView key={block.id} hobbyId={hobby.id} block={block} />;
            case "libreria":
              return <LibraryBlockView key={block.id} hobbyId={hobby.id} block={block} />;
            case "partite":
              return <MatchesBlockView key={block.id} hobbyId={hobby.id} block={block} />;
          }
        })}
      </div>

      <button
        onClick={() => setAddBlockOpen(true)}
        className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-3.5 text-sm text-ink-400 transition hover:border-aura-violet/50 hover:text-ink-100"
      >
        <Plus size={15} /> Aggiungi blocco
      </button>

      {editOpen && <AddHobbyModal hobby={hobby} onClose={() => setEditOpen(false)} />}
      {addBlockOpen && <AddBlockSheet hobbyId={hobby.id} onClose={() => setAddBlockOpen(false)} />}
      {confirmDelete && (
        <ConfirmDialog
          title="Eliminare questo hobby?"
          description="Tutti i suoi blocchi e contenuti andranno persi. L'azione non si può annullare."
          onConfirm={() => {
            removeHobby(hobby.id);
            router.push("/hobby");
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
