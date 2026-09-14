"use client";
import Link from "next/link";
import { X } from "lucide-react";
import { ResolvedEntity } from "@/lib/entity-resolver";
import { useResolvedImage } from "@/lib/use-resolved-image";

/**
 * Tre rese visive diverse per lo stesso concetto — non uno stampino unico forzato su ogni
 * tipo, come richiesto ("il più graficamente apprezzabile possibile, non per forza
 * seguendo una linea guida data dall'app"):
 * 1. Persone/animali/luoghi: un cerchio con foto vera (o icona) e un alone del colore
 *    dell'entità — la stessa identità visiva che hanno ovunque altrove nell'app.
 * 2. Hobby/wishlist: un riquadro con la foto a piena vista, più rettangolare — hanno spesso
 *    una foto che vale la pena mostrare più grande di un cerchietto.
 * 3. Task/ingredienti/schede/note: una chip colorata con icona — non hanno una foto propria
 *    nell'app, quindi non ne inventiamo una: l'icona di categoria è già un'identità chiara.
 */
export function EntityLinkCard({ entity, onRemove }: { entity: ResolvedEntity; onRemove?: () => void }) {
  const resolvedPhotoUrl = useResolvedImage(entity.photoKey);
  const photo = entity.imageUrl ?? resolvedPhotoUrl;
  const Icon = entity.icon;

  const isCircular = entity.link.type === "persona" || entity.link.type === "animale" || entity.link.type === "luogo";
  const isPhotoCard = entity.link.type === "hobby" || entity.link.type === "wishlist";

  const inner = isCircular ? (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="relative">
        <span
          className="absolute inset-[-4px] rounded-full blur-md"
          style={{ background: entity.color, opacity: entity.missing ? 0.15 : 0.4 }}
          aria-hidden
        />
        <div
          className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2"
          style={{ borderColor: `${entity.color}88` }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon size={20} style={{ color: entity.color }} />
          )}
        </div>
      </div>
      <p className={`max-w-[76px] truncate text-[11px] ${entity.missing ? "text-ink-800 italic" : "text-ink-200"}`}>{entity.label}</p>
    </div>
  ) : isPhotoCard ? (
    <div className="w-28 overflow-hidden rounded-xl2 border border-white/10 bg-white/[0.02]">
      <div className="flex aspect-square items-center justify-center overflow-hidden bg-white/[0.03]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon size={24} style={{ color: entity.color }} />
        )}
      </div>
      <p className={`truncate px-2 py-1.5 text-[11px] ${entity.missing ? "text-ink-800 italic" : "text-ink-200"}`}>{entity.label}</p>
    </div>
  ) : (
    <div
      className="flex items-center gap-2 rounded-full border px-3 py-2"
      style={{ borderColor: `${entity.color}55`, background: `${entity.color}14` }}
    >
      <Icon size={14} style={{ color: entity.color }} />
      <span className={`max-w-[140px] truncate text-xs ${entity.missing ? "text-ink-800 italic" : "text-ink-200"}`}>{entity.label}</span>
    </div>
  );

  return (
    <div className="group relative shrink-0">
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="focus-ring absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-void-950 text-ink-600 opacity-0 shadow transition hover:text-aura-pink group-hover:opacity-100"
          aria-label="Rimuovi collegamento"
        >
          <X size={11} />
        </button>
      )}
      {entity.missing ? (
        <div className="cursor-default opacity-60">{inner}</div>
      ) : (
        <Link href={entity.href} className="focus-ring block">
          {inner}
        </Link>
      )}
    </div>
  );
}
