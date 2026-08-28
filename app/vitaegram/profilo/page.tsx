"use client";
import { useEffect, useState } from "react";
import { Aperture } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useVitaegramSocial } from "@/lib/vitaegram-social-context";
import { useVitaegramDraft } from "@/lib/vitaegram-draft-context";
import { VitaegramPost } from "@/lib/vitaegram-social-types";
import { NicknameGate } from "@/components/vitaegram/NicknameGate";
import { PostCard } from "@/components/vitaegram/PostCard";
import { PostComments } from "@/components/vitaegram/PostComments";
import { ImprimiMomento } from "@/components/vitaegram/ImprimiMomento";
import { AuraAvatar } from "@/components/ui/AuraAvatar";

function Bacheca() {
  const { profile } = useProfile();
  const { hydrated, posts, publish } = useVitaegramSocial();
  const { draft } = useVitaegramDraft();
  const [composerOpen, setComposerOpen] = useState(false);
  const [commentsFor, setCommentsFor] = useState<VitaegramPost | null>(null);

  // Riprende da sola una bozza lasciata a metà quando sei uscito con "Home" — vedi
  // lib/vitaegram-draft-context.tsx. Solo all'ingresso in questa scheda, una volta.
  useEffect(() => {
    if (draft?.kind === "post") setComposerOpen(true);
    if (draft?.kind === "comment") {
      const p = posts.find((x) => x.id === draft.postId);
      if (p) setCommentsFor(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated) return null;
  const ownPosts = posts.filter((p) => p.authorId === "user");

  const share = (post: VitaegramPost) => {
    publish({ caption: `Condiviso Da @${post.authorId}: ${post.caption}`, moodId: post.moodId, tags: post.tags });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center gap-4">
        <AuraAvatar imageUrl={profile.avatarUrl} firstName={profile.firstName} lastName={profile.lastName} size={68} ring="idle" glowColor="#B79A6B" />
        <div>
          <p className="font-display text-lg text-ink-100">@{profile.nickname}</p>
          <p className="text-xs text-ink-800">{ownPosts.length} Post{ownPosts.length === 1 ? "" : ""}</p>
        </div>
      </div>

      <button
        onClick={() => setComposerOpen(true)}
        className="focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-3.5 text-sm text-ink-600 transition hover:border-[#B79A6B]/50 hover:text-ink-200"
      >
        <Aperture size={16} /> Imprimi Momento
      </button>

      <div className="mt-6 space-y-5">
        {ownPosts.length === 0 && <p className="mt-10 text-center text-sm text-ink-800">Non Hai Ancora Pubblicato Nulla Qui.</p>}
        {ownPosts.map((post) => (
          <PostCard key={post.id} post={post} onOpenComments={() => setCommentsFor(post)} onShare={() => share(post)} />
        ))}
      </div>

      {composerOpen && <ImprimiMomento onClose={() => setComposerOpen(false)} />}
      {commentsFor && <PostComments post={posts.find((p) => p.id === commentsFor.id) ?? commentsFor} onClose={() => setCommentsFor(null)} />}
    </div>
  );
}

export default function ProfiloVitaegramPage() {
  return (
    <NicknameGate>
      <Bacheca />
    </NicknameGate>
  );
}
