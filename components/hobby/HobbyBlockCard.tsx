"use client";
import { useHobby } from "@/lib/hobby-context";
import { GlassCard } from "../ui/GlassCard";
import { BlockHeader } from "./BlockHeader";

/**
 * Corretto secondo le istruzioni: i blocchi della scheda Hobby stavano sempre aperti, senza
 * modo di richiuderli, e non si potevano riordinare (a differenza dei widget della Home, che
 * hanno entrambe le cose). Invece di ripetere la stessa logica di apertura/chiusura e
 * spostamento in ciascuno dei sette tipi di blocco, questo guscio comune la applica una sola
 * volta: ogni *BlockView passa qui solo cosa cambia (titolo, sottotitolo, l'azione "+" propria
 * del tipo) e il proprio contenuto come children — quel contenuto smette di essere disegnato
 * quando il blocco è chiuso, invece di restare nel DOM solo nascosto.
 *
 * Le finestre di dettaglio/i wizard di un blocco (aggiungi/modifica una voce) NON vanno messi
 * nei children qui dentro: sono overlay a schermo intero, indipendenti da quanto il blocco sia
 * aperto o chiuso — un tocco su "+" nell'header deve continuare a funzionare anche a blocco
 * chiuso. Ogni *BlockView li rende infatti come fratelli di HobbyBlockCard, non al suo interno.
 */
export function HobbyBlockCard({
  hobbyId,
  blockId,
  collapsed,
  index,
  total,
  title,
  subtitle,
  extra,
  children,
}: {
  hobbyId: string;
  blockId: string;
  /** `undefined` per i blocchi salvati prima che questo campo esistesse — trattato come
   * chiuso: il default dev'essere "a tendina" per tutti, non solo per i blocchi nuovi. */
  collapsed: boolean | undefined;
  index: number;
  total: number;
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { setBlockCollapsed, moveBlock } = useHobby();
  const isCollapsed = collapsed ?? true;

  return (
    <GlassCard className="p-4">
      <BlockHeader
        hobbyId={hobbyId}
        blockId={blockId}
        title={title}
        subtitle={subtitle}
        extra={extra}
        collapsed={isCollapsed}
        onToggleCollapsed={() => setBlockCollapsed(hobbyId, blockId, !isCollapsed)}
        canMoveUp={index > 0}
        canMoveDown={index < total - 1}
        onMoveUp={() => moveBlock(hobbyId, blockId, "up")}
        onMoveDown={() => moveBlock(hobbyId, blockId, "down")}
      />
      {!isCollapsed && children}
    </GlassCard>
  );
}
