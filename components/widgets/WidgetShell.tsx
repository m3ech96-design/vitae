"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLongPress } from "@/lib/use-long-press";
import { useWidgets } from "@/lib/widgets/widgets-context";
import { WidgetSize } from "@/lib/widgets/types";
import { WidgetActionsSheet } from "./WidgetActionsSheet";

const SIZE_SPAN: Record<WidgetSize, string> = {
  // Griglia a 6 colonne: minimo comune multiplo di 2 e 3, così quadrato/mezza/intera
  // convivono sulla stessa griglia senza mai un resto scomodo.
  square: "col-span-2 aspect-square",
  half: "col-span-3",
  full: "col-span-6",
};

/**
 * Il guscio comune a ogni widget — dimensione secondo la taglia scelta, pressione lunga per
 * ridimensionare/spostare/rimuovere, e uno scroll magnetico interno con più "pagine" quando
 * il widget ne offre più di una (lo swipe destra/sinistra per informazioni ulteriori,
 * richiesto esplicitamente) — `scroll-snap` nativo, stessa tecnica già usata nella Wishlist
 * a schermo intero, qui applicata dentro una card. `touch-action: pan-x` sulla fascia di
 * scroll fa sì che il gesto orizzontale resti isolato lì: il resto della schermata non si
 * muove durante lo scroll/swipe di un widget, come richiesto.
 *
 * Corretto secondo le istruzioni: un tocco sulla card non portava mai da nessuna parte — il
 * widget mostrava il dato ma toccarlo non faceva nulla, mentre l'unico gesto riconosciuto
 * (la pressione lunga) apre le azioni del widget stesso (ridimensiona/sposta/rimuovi), non il
 * contesto del dato mostrato. Un tocco normale ora porta a `href` quando presente — la
 * pagina/scheda a cui appartiene quel dato — mentre la pressione lunga resta quella di
 * sempre: `useLongPress` già distingue le due cose da sé (un tocco che diventa pressione
 * lunga non fa scattare ANCHE il click, vedi `onClickCapture` nell'hook), quindi basta
 * aggiungere `onClick` allo stesso contenitore senza toccare quella logica.
 */
export function WidgetShell({
  placedId,
  title,
  size,
  allowedSizes,
  index,
  total,
  pages,
  href,
}: {
  placedId: string;
  title: string;
  size: WidgetSize;
  allowedSizes: WidgetSize[];
  index: number;
  total: number;
  pages: React.ReactNode[];
  href?: string;
}) {
  const router = useRouter();
  const { removeWidget, resizeWidget, reorder } = useWidgets();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const longPress = useLongPress(() => setActionsOpen(true));

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className={`${SIZE_SPAN[size]} relative`}>
      <div
        {...longPress.handlers}
        onClick={href ? () => router.push(href) : undefined}
        role={href ? "link" : undefined}
        className={`glass sheen-top relative h-full overflow-hidden rounded-xl3 transition ${longPress.pressing ? "scale-[0.97] opacity-80" : ""} ${href ? "cursor-pointer" : ""}`}
      >
        {pages.length > 1 ? (
          <>
            <div
              ref={scrollRef}
              onScroll={onScroll}
              className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
              style={{ touchAction: "pan-x" }}
            >
              {pages.map((p, i) => (
                <div key={i} className="h-full w-full shrink-0 snap-start p-3.5">
                  {p}
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
              {pages.map((_, i) => (
                <span key={i} className={`h-1 rounded-full transition-all ${i === page ? "w-3 bg-aura-violet" : "w-1 bg-white/20"}`} />
              ))}
            </div>
          </>
        ) : (
          <div className="h-full p-3.5">{pages[0]}</div>
        )}
      </div>

      {actionsOpen && (
        <WidgetActionsSheet
          title={title}
          size={size}
          allowedSizes={allowedSizes}
          canMoveUp={index > 0}
          canMoveDown={index < total - 1}
          onResize={(s) => resizeWidget(placedId, s)}
          onMoveUp={() => reorder(index, index - 1)}
          onMoveDown={() => reorder(index, index + 1)}
          onRemove={() => removeWidget(placedId)}
          onClose={() => setActionsOpen(false)}
        />
      )}
    </div>
  );
}
