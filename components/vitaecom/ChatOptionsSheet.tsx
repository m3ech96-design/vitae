"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Image as ImageIcon, Link2, X } from "lucide-react";
import { VitaecomChatMessage } from "@/lib/vitaecom-chat-context";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";

const URL_PATTERN = /(https?:\/\/[^\s]+)/gi;

function timeOf(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

/** Una singola miniatura per "Media inviati" — un hook per messaggio, non dentro un ciclo:
 * per questo è un componente a parte invece di chiamare useResolvedImage nella .map(). */
function MediaThumb({ message }: { message: VitaecomChatMessage }) {
  const photoUrl = useResolvedImage(message.photoKey);
  const videoUrl = useResolvedVideo(message.videoKey);
  if (!photoUrl && !videoUrl) return null;
  return (
    <div className="aspect-square overflow-hidden rounded-lg bg-white/[0.03]">
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      )}
      {videoUrl && <video src={videoUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />}
    </div>
  );
}

/**
 * Aperto toccando l'avatar in cima a una chat singola: tre funzioni, non tre schede
 * separate — un solo pannello che cambia vista, con una freccia indietro verso il menu
 * invece di tre pulsanti "Chiudi" diversi.
 */
export function ChatOptionsSheet({
  thread,
  nickname,
  onClose,
}: {
  thread: VitaecomChatMessage[];
  nickname: string;
  onClose: () => void;
}) {
  const [view, setView] = useState<"menu" | "search" | "media" | "links">("menu");
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("it-IT");
    if (!q) return [];
    return thread.filter((m) => m.text.toLocaleLowerCase("it-IT").includes(q));
  }, [thread, query]);

  const mediaMessages = useMemo(() => thread.filter((m) => m.photoKey || m.videoKey), [thread]);

  // Solo i tuoi messaggi possono davvero contenere un link (vedi la nota in
  // vitaecom-chat-context.tsx: i messaggi dell'altra parte sono sempre testo semplice
  // scritto a mano, mai generati con URL veri dentro).
  const links = useMemo(() => {
    const found: { url: string; messageId: string; createdAt: string }[] = [];
    thread.forEach((m) => {
      const matches = m.text.match(URL_PATTERN);
      matches?.forEach((url) => found.push({ url, messageId: m.id, createdAt: m.createdAt }));
    });
    return found;
  }, [thread]);

  const title: string | React.ReactNode =
    view === "menu" ? (
      `@${nickname}`
    ) : (
      <span className="flex items-center gap-2">
        <button onClick={() => setView("menu")} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Indietro">
          <ArrowLeft size={16} />
        </button>
        {view === "search" ? "Trova nella chat" : view === "media" ? "Media inviati" : "Link inviati"}
      </span>
    );

  return (
    <PersonalCardSheet title={title} onClose={onClose}>
      {view === "menu" && (
        <div className="space-y-2">
          <button
            onClick={() => setView("search")}
            className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-ink-100 transition hover:border-white/15"
          >
            <Search size={16} className="text-ink-600" /> Trova nella chat
          </button>
          <button
            onClick={() => setView("media")}
            className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-ink-100 transition hover:border-white/15"
          >
            <ImageIcon size={16} className="text-ink-600" /> Media inviati
          </button>
          <button
            onClick={() => setView("links")}
            className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-ink-100 transition hover:border-white/15"
          >
            <Link2 size={16} className="text-ink-600" /> Link inviati
          </button>
        </div>
      )}

      {view === "search" && (
        <div>
          <div className="flex items-center gap-2 rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2">
            <Search size={14} className="text-ink-600" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca una parola o una frase"
              className="flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-800 outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="focus-ring text-ink-800 hover:text-ink-200" aria-label="Svuota">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {query && searchResults.length === 0 && (
              <p className="text-center text-sm text-ink-800">Nessun messaggio trovato.</p>
            )}
            {searchResults.map((m) => (
              <div key={m.id} className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
                <p className="text-sm text-ink-200">{m.text}</p>
                <p className="mt-1 text-[10px] text-ink-800">
                  {m.fromUser ? "Tu" : `@${nickname}`} · {timeOf(m.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "media" && (
        <div>
          {mediaMessages.length === 0 ? (
            <p className="text-center text-sm text-ink-800">Nessun media inviato in questa chat.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {mediaMessages.map((m) => (
                <MediaThumb key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>
      )}

      {view === "links" && (
        <div className="space-y-2">
          {links.length === 0 ? (
            <p className="text-center text-sm text-ink-800">Nessun link inviato in questa chat.</p>
          ) : (
            links.map((l, i) => (
              <a
                key={`${l.messageId}-${i}`}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring block truncate rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-sm text-[#B79A6B] hover:border-white/15"
              >
                {l.url}
              </a>
            ))
          )}
        </div>
      )}
    </PersonalCardSheet>
  );
}
