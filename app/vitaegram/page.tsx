"use client";
import { useState } from "react";
import { Globe2 } from "lucide-react";
import { useVitaegramSocial } from "@/lib/vitaegram-social-context";
import { VitaegramPost } from "@/lib/vitaegram-social-types";
import { NicknameGate } from "@/components/vitaegram/NicknameGate";
import { PostCard } from "@/components/vitaegram/PostCard";
import { PostComments } from "@/components/vitaegram/PostComments";

function VitaeworldFeed() {
  const { hydrated, posts, publish } = useVitaegramSocial();
  const [commentsFor, setCommentsFor] = useState<VitaegramPost | null>(null);

  if (!hydrated) return null;

  const share = (post: VitaegramPost) => {
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

      <div className="mt-6 space-y-5">
        {posts.map((post) => (
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
