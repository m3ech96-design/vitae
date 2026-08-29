"use client";
import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useVitaecomDraft } from "@/lib/vitaecom-draft-context";
import { VitaecomPost } from "@/lib/vitaecom-social-types";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { PostCard } from "@/components/vitaecom/PostCard";
import { PostComments } from "@/components/vitaecom/PostComments";

function VitaeworldFeed() {
  const { hydrated, posts, publish, knownAccountIds } = useVitaecomSocial();
  const { draft } = useVitaecomDraft();
  const [commentsFor, setCommentsFor] = useState<VitaecomPost | null>(null);

  // Riprende da sola una bozza di commento lasciata a metà — vedi lib/vitaecom-draft-context.tsx.
  useEffect(() => {
    if (draft?.kind === "comment") {
      const p = posts.find((x) => x.id === draft.postId);
      if (p) setCommentsFor(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated) return null;

  const share = (post: VitaecomPost) => {
    publish({
      caption: `Condiviso Da @${post.authorId === "user" ? "te" : post.authorId}: ${post.caption}`,
      moodId: post.moodId,
      tags: post.tags,
    });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center gap-2">
        <Globe2 size={16} className="text-[#B79A6B]" />
        <p className="font-display text-xs uppercase tracking-[0.28em] text-[#B79A6B]">Vitaeworld</p>
      </div>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Cosa Sta Succedendo</h1>

      {/* Per privacy, un account "Sconosciuto" non ti mostra i suoi post da nessuna parte
         (vedi KnowPanel) — qui, il posto dove più si nota. I tuoi restano sempre visibili. */}
      <div className="mt-6 space-y-5">
        {posts
          .filter((post) => post.authorId === "user" || knownAccountIds.includes(post.authorId))
          .map((post) => (
          <div key={post.id}>
            {post.isDemo && <p className="mb-1.5 text-[9px] uppercase tracking-wide text-ink-800">Anteprima — Post Di Esempio</p>}
            <PostCard post={post} onOpenComments={() => setCommentsFor(post)} onShare={() => share(post)} />
          </div>
        ))}
      </div>

      {commentsFor && <PostComments post={posts.find((p) => p.id === commentsFor.id) ?? commentsFor} onClose={() => setCommentsFor(null)} />}
    </div>
  );
}

export default function VitaeworldPage() {
  return (
    <NicknameGate>
      <VitaeworldFeed />
    </NicknameGate>
  );
}
