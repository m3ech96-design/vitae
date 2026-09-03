"use client";
import { useState } from "react";
import { Plus, ImagePlus, Flame } from "lucide-react";
import { useHobby } from "@/lib/hobby-context";
import { MatchesBlock } from "@/lib/hobby-types";
import { matchRecord } from "@/lib/hobby-stats";
import { formatDateShort } from "@/lib/date-format";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { GlassCard } from "../ui/GlassCard";
import { BlockHeader } from "./BlockHeader";
import { MatchModal } from "./MatchModal";
import { ImageCropInput } from "../ui/ImageCropInput";

const RESULT_COLOR: Record<string, string> = { vittoria: "#34D399", sconfitta: "#FF6B9D", pareggio: "#FFB454" };
const RESULT_LABEL: Record<string, string> = { vittoria: "V", sconfitta: "S", pareggio: "P" };

function CoverPhoto({ photoKey }: { photoKey?: string }) {
  const url = useResolvedImage(photoKey);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

/**
 * Copertina del blocco — box art del videogioco, stemma della squadra, o qualunque
 * immagine rappresenti "cosa" si sta giocando, richiesta esplicitamente in aggiunta alla
 * foto per-partita già prevista (la stessa idea della copertina già usata in Libreria, qui
 * applicata al blocco intero invece che a una singola voce).
 */
function BlockCover({ hobbyId, blockId, photoKey }: { hobbyId: string; blockId: string; photoKey?: string }) {
  const { setMatchesBlockPhoto } = useHobby();
  return (
    <ImageCropInput
      shape="square"
      onChange={(key) => setMatchesBlockPhoto(hobbyId, blockId, key)}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="focus-ring flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl2 border border-dashed border-white/15 text-ink-600 transition hover:border-aura-amber/50"
          aria-label="Copertina del blocco"
        >
          {photoKey ? <CoverPhoto photoKey={photoKey} /> : <ImagePlus size={16} />}
        </button>
      )}
    />
  );
}

export function MatchesBlockView({ hobbyId, block }: { hobbyId: string; block: MatchesBlock }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const record = matchRecord(block);
  const editMatch = block.matches.find((m) => m.id === editId);

  return (
    <GlassCard className="p-4">
      <div className="flex items-start gap-3">
        <BlockCover hobbyId={hobbyId} blockId={block.id} photoKey={block.photoKey} />
        <div className="min-w-0 flex-1">
          <BlockHeader
            hobbyId={hobbyId}
            blockId={block.id}
            title={block.title}
            subtitle={block.matches.length > 0 ? `${record.wins}V ${record.losses}S ${record.draws}P · ${Math.round(record.winRatePct)}%` : undefined}
            extra={
              <button onClick={() => setAddOpen(true)} className="focus-ring flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-[11px] text-ink-300 hover:border-aura-amber/50">
                <Plus size={12} /> Partita
              </button>
            }
          />
        </div>
      </div>

      {block.matches.length === 0 ? (
        <p className="text-xs text-ink-800">Ancora nessuna partita registrata.</p>
      ) : (
        <>
          {record.currentStreak && record.currentStreak.count >= 2 && (
            <p className="mb-2 flex items-center gap-1 text-[11px] text-ink-600">
              <Flame size={12} className="text-aura-amber" /> {record.currentStreak.count} {RESULT_LABEL[record.currentStreak.result].toLowerCase() === "v" ? "vittorie" : record.currentStreak.result === "sconfitta" ? "sconfitte" : "pareggi"} di fila
            </p>
          )}
          <div className="space-y-1.5">
            {[...block.matches]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => setEditId(m.id)}
                  className="focus-ring flex w-full items-center justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.015] px-3.5 py-2 text-left transition hover:border-white/20"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-display"
                      style={{ background: `${RESULT_COLOR[m.result]}22`, color: RESULT_COLOR[m.result] }}
                    >
                      {RESULT_LABEL[m.result]}
                    </span>
                    <span className="truncate text-sm text-ink-100">{m.opponent || m.competition || formatDateShort(m.date)}</span>
                  </div>
                  <span className="shrink-0 text-xs text-ink-600">{m.score || formatDateShort(m.date)}</span>
                </button>
              ))}
          </div>
        </>
      )}

      {addOpen && <MatchModal hobbyId={hobbyId} blockId={block.id} onClose={() => setAddOpen(false)} />}
      {editMatch && <MatchModal hobbyId={hobbyId} blockId={block.id} match={editMatch} onClose={() => setEditId(null)} />}
    </GlassCard>
  );
}
