"use client";
import { useEffect, useState } from "react";
import { Newspaper, Share2, ExternalLink } from "lucide-react";
import { NewsItem } from "@/app/api/news/route";
import { useNews } from "@/lib/use-news";
import { ShareNewsComposer } from "@/components/news/ShareNewsComposer";

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Ora";
  if (mins < 60) return `${mins}m fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  return `${Math.floor(hours / 24)}g fa`;
}

function NewsCard({ item, onShare }: { item: NewsItem; onShare: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const longDescription = item.description.length > 110;

  return (
    <div className="overflow-hidden rounded-xl2 border border-white/10 bg-white/[0.02]">
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-40 w-full object-cover" />
      )}
      <div className="p-4">
        <p className="text-sm text-ink-100">{item.title}</p>
        {item.description && (
          <>
            <p className={expanded ? "mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-ink-400" : "mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-400"}>
              {item.description}
            </p>
            {longDescription && (
              <button onClick={() => setExpanded((v) => !v)} className="focus-ring mt-1 text-[11px] text-[#B79A6B]">
                {expanded ? "Riduci" : "Espandi"}
              </button>
            )}
          </>
        )}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] text-ink-800">ANSA · {timeAgo(item.pubDate)}</p>
          <div className="flex items-center gap-3">
            <button onClick={onShare} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Condividi su Vitaecom">
              <Share2 size={15} />
            </button>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Apri l'articolo">
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const { categories, error } = useNews();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sharingItem, setSharingItem] = useState<NewsItem | null>(null);

  // Imposta la prima categoria come attiva non appena i dati arrivano — l'hook condiviso può
  // già avere una cache pronta al primo render (altro consumer l'ha già popolata), quindi
  // questo deve reagire a `categories` invece che al solo mount.
  useEffect(() => {
    if (categories && activeId === null) setActiveId(categories[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const active = categories?.find((c) => c.id === activeId);

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center gap-2">
        <Newspaper size={16} className="text-[#B79A6B]" />
        <p className="font-display text-xs uppercase tracking-[0.28em] text-[#B79A6B]">News</p>
      </div>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Cosa succede nel mondo</h1>
      <p className="mt-1 text-xs text-ink-800">Fonte: ANSA — tocca un articolo per leggerlo per intero sul sito originale.</p>

      {error && <p className="mt-10 text-center text-sm text-ink-800">Le news non sono raggiungibili al momento. Riprova più tardi.</p>}
      {!error && categories === null && <p className="mt-10 text-center text-sm text-ink-800">Carico le ultime notizie…</p>}
      {!error && categories?.length === 0 && <p className="mt-10 text-center text-sm text-ink-800">Nessuna notizia disponibile al momento.</p>}

      {categories && categories.length > 0 && (
        <>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`focus-ring shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition ${
                  activeId === c.id ? "border-[#B79A6B]/60 bg-[#B79A6B]/15 text-ink-100" : "border-white/10 text-ink-600 hover:border-white/25"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {active?.items.map((item) => (
              <NewsCard key={item.link} item={item} onShare={() => setSharingItem(item)} />
            ))}
          </div>
        </>
      )}

      {sharingItem && <ShareNewsComposer item={sharingItem} onClose={() => setSharingItem(null)} />}
    </div>
  );
}
