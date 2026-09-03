"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ProjectsBlock } from "@/lib/hobby-types";
import { projectsTotalCost } from "@/lib/hobby-stats";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { StarDisplay } from "./StarRating";
import { GlassCard } from "../ui/GlassCard";
import { BlockHeader } from "./BlockHeader";
import { ProjectModal } from "./ProjectModal";

const STATUS_COLOR: Record<string, string> = {
  idea: "#8B90A8",
  "in-corso": "#FFB454",
  "in-pausa": "#5EC8FF",
  finito: "#34D399",
  abbandonato: "#FF6B9D",
};
const STATUS_LABEL: Record<string, string> = {
  idea: "Idea",
  "in-corso": "In corso",
  "in-pausa": "In pausa",
  finito: "Finito",
  abbandonato: "Abbandonato",
};

function ProjectThumb({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return <div className="aspect-square w-full rounded-xl2 bg-white/[0.05]" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="aspect-square w-full rounded-xl2 object-cover" />;
}

export function ProjectsBlockView({ hobbyId, block }: { hobbyId: string; block: ProjectsBlock }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const totalCost = projectsTotalCost(block);
  const editProject = block.projects.find((p) => p.id === editId);

  return (
    <GlassCard className="p-4">
      <BlockHeader
        hobbyId={hobbyId}
        blockId={block.id}
        title={block.title}
        subtitle={block.projects.length > 0 ? `${block.projects.length} progetti${totalCost > 0 ? ` · ${totalCost.toLocaleString("it-IT")}€ investiti` : ""}` : undefined}
        extra={
          <button onClick={() => setAddOpen(true)} className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] text-ink-300 hover:border-aura-pink/50">
            <Plus size={12} /> Progetto
          </button>
        }
      />

      {block.projects.length === 0 ? (
        <p className="text-xs text-ink-800">Ancora nessun progetto.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {block.projects.map((p) => (
            <button key={p.id} onClick={() => setEditId(p.id)} className="text-left">
              <ProjectThumb photoKey={p.photoKeys[0]} />
              <p className="mt-1 truncate text-[11px] text-ink-100">{p.name}</p>
              <p className="text-[10px]" style={{ color: STATUS_COLOR[p.status] }}>{STATUS_LABEL[p.status]}</p>
              {p.rating && <StarDisplay value={p.rating} size={9} />}
            </button>
          ))}
        </div>
      )}

      {addOpen && <ProjectModal hobbyId={hobbyId} blockId={block.id} onClose={() => setAddOpen(false)} />}
      {editProject && <ProjectModal hobbyId={hobbyId} blockId={block.id} project={editProject} onClose={() => setEditId(null)} />}
    </GlassCard>
  );
}
