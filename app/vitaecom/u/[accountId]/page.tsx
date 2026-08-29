"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { VitaecomPost } from "@/lib/vitaecom-social-types";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { PostCard } from "@/components/vitaecom/PostCard";
import { PostComments } from "@/components/vitaecom/PostComments";
import { ProfileHeader } from "@/components/vitaecom/ProfileHeader";

function GuestProfile({ accountId }: { accountId: string }) {
  const router = useRouter();
  const { profile, hydrated: profileHydrated } = useProfile();
  const { hydrated, posts, publish } = useVitaecomSocial();
  const [commentsFor, setCommentsFor] = useState<VitaecomPost | null>(null);
  const isSelf = accountId === "user";

  // Il tuo profilo resta "casa" (owner): niente doppia identità per la stessa persona
  // dietro due rotte diverse — se qualcosa punta qui verso di te, riporta subito a dove
  // il proprietario apre davvero le proprie cose. Il redirect vive in un effect, non nel
  // corpo del render: chiamare il router mentre si sta ancora disegnando il componente è
  // un effetto collaterale fuori posto, anche se qui sarebbe quasi sempre passato inosservato.
  useEffect(() => {
    if (isSelf) router.replace("/vitaecom/profilo");
  }, [isSelf, router]);

  if (!hydrated || !profileHydrated || isSelf) return null;

  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const account = resolveAccount(accountId, userAccount);
  const accountPosts = posts.filter((p) => p.authorId === accountId);

  const share = (post: VitaecomPost) => {
    publish({ caption: `Condiviso Da @${post.authorId}: ${post.caption}`, moodId: post.moodId, tags: post.tags });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <button onClick={() => router.back()} className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200">
        <ArrowLeft size={16} /> Indietro
      </button>

      <div className="mt-4">
        <ProfileHeader account={account} isOwner={false} posts={posts} />
      </div>

      <div className="mt-7 space-y-5">
        {accountPosts.length === 0 && (
          <p className="mt-10 text-center text-sm text-ink-800">@{account.nickname} Non Ha Ancora Pubblicato Nulla.</p>
        )}
        {accountPosts.map((post) => (
          <PostCard key={post.id} post={post} onOpenComments={() => setCommentsFor(post)} onShare={() => share(post)} />
        ))}
      </div>

      {commentsFor && <PostComments post={posts.find((p) => p.id === commentsFor.id) ?? commentsFor} onClose={() => setCommentsFor(null)} />}
    </div>
  );
}

export default function GuestProfilePage({ params }: { params: { accountId: string } }) {
  return (
    <NicknameGate>
      <GuestProfile accountId={params.accountId} />
    </NicknameGate>
  );
}
