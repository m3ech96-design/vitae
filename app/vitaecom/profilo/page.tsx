"use client";
import { useEffect, useState } from "react";
import { Aperture } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useVitaecomDraft } from "@/lib/vitaecom-draft-context";
import { VitaecomPost } from "@/lib/vitaecom-social-types";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { PostCard } from "@/components/vitaecom/PostCard";
import { PostComments } from "@/components/vitaecom/PostComments";
import { ImprimiMomento } from "@/components/vitaecom/ImprimiMomento";
import { ProfileHeader } from "@/components/vitaecom/ProfileHeader";

function Bacheca() {
  const { profile, hydrated: profileHydrated } = useProfile();
  const { hydrated, posts, publish } = useVitaecomSocial();
  const { draft } = useVitaecomDraft();
  const [composerOpen, setComposerOpen] = useState(false);
  const [commentsFor, setCommentsFor] = useState<VitaecomPost | null>(null);

  // Riprende da sola una bozza lasciata a metà quando sei uscito con "Home" — vedi
  // lib/vitaecom-draft-context.tsx. Solo all'ingresso in questa scheda, una volta.
  useEffect(() => {
    if (draft?.kind === "post") setComposerOpen(true);
    if (draft?.kind === "comment") {
      const p = posts.find((x) => x.id === draft.postId);
      if (p) setCommentsFor(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated || !profileHydrated) return null;
  const ownPosts = posts.filter((p) => p.authorId === "user");
  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };

  const share = (post: VitaecomPost) => {
    publish({ caption: `Condiviso Da @${post.authorId}: ${post.caption}`, moodId: post.moodId, tags: post.tags });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <ProfileHeader account={userAccount} isOwner posts={posts} />

      <button
        onClick={() => setComposerOpen(true)}
        className="focus-ring mt-7 flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-3.5 text-sm text-ink-600 transition hover:border-[#B79A6B]/50 hover:text-ink-200"
      >
        <Aperture size={16} /> Imprimi Momento
      </button>

      <div className="mt-6 space-y-5">
        {ownPosts.length === 0 && <p className="mt-10 text-center text-sm text-ink-800">Non hai ancora pubblicato nulla qui.</p>}
        {ownPosts.map((post) => (
          <PostCard key={post.id} post={post} onOpenComments={() => setCommentsFor(post)} onShare={() => share(post)} />
        ))}
      </div>

      {composerOpen && <ImprimiMomento onClose={() => setComposerOpen(false)} />}
      {commentsFor && <PostComments post={posts.find((p) => p.id === commentsFor.id) ?? commentsFor} onClose={() => setCommentsFor(null)} />}
    </div>
  );
}

export default function ProfiloVitaecomPage() {
  return (
    <NicknameGate>
      <Bacheca />
    </NicknameGate>
  );
}

