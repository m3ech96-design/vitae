"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useMood } from "@/lib/mood-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { VitaecomPost } from "@/lib/vitaecom-social-types";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { PostCard } from "@/components/vitaecom/PostCard";
import { PostComments } from "@/components/vitaecom/PostComments";
import { ShareComposer } from "@/components/vitaecom/ShareComposer";
import { ProfileHeader } from "@/components/vitaecom/ProfileHeader";
import { CollapsedProfileBar } from "@/components/vitaecom/CollapsedProfileBar";

// Quanto scroll (in pixel) serve per arrivare alla raccolta completa — un'approssimazione
// dichiarata di "quando il primo post arriva all'altezza dell'avatar" (misurarlo pixel per
// pixel dipenderebbe da quanti post ci sono, compreso il caso di zero post): una soglia
// fissa, ragionevole per la maggior parte degli schermi, resta più robusta di una misura
// live che si romperebbe proprio nei casi limite.
const COLLAPSE_SCROLL_PX = 260;
const PULSE_SETTLE_MS = 420;

function GuestProfile({ accountId }: { accountId: string }) {
  const router = useRouter();
  const { profile, hydrated: profileHydrated } = useProfile();
  const { hydrated, posts, knownAccountIds, hiddenPostIds, mutedAccountIds } = useVitaecomSocial();
  const { allMoods } = useMood();
  const [commentsFor, setCommentsFor] = useState<VitaecomPost | null>(null);
  const [sharingPost, setSharingPost] = useState<VitaecomPost | null>(null);
  const [progress, setProgress] = useState(0);
  const [pulsing, setPulsing] = useState(false);
  const pulseTimer = useRef<ReturnType<typeof setTimeout>>();
  const rafPending = useRef(false);
  const isSelf = accountId === "user";

  // Il tuo profilo resta "casa" (owner): niente doppia identità per la stessa persona
  // dietro due rotte diverse — se qualcosa punta qui verso di te, riporta subito a dove
  // il proprietario apre davvero le proprie cose. Il redirect vive in un effect, non nel
  // corpo del render: chiamare il router mentre si sta ancora disegnando il componente è
  // un effetto collaterale fuori posto, anche se qui sarebbe quasi sempre passato inosservato.
  useEffect(() => {
    if (isSelf) router.replace("/vitaecom/profilo");
  }, [isSelf, router]);

  // La transizione della Vetrina che si raccoglie: `progress` è una funzione diretta dello
  // scroll (mai un accumulatore), quindi tornare in cima la fa scorrere semplicemente al
  // contrario da sola — nessun caso speciale per il verso "in su". Il guizzo liquido nel
  // riquadro (`pulsing`) segue lo stesso scroll e si assesta da solo con un piccolo debounce.
  useEffect(() => {
    const onScroll = () => {
      if (rafPending.current) return;
      rafPending.current = true;
      requestAnimationFrame(() => {
        setProgress(Math.min(1, Math.max(0, window.scrollY / COLLAPSE_SCROLL_PX)));
        rafPending.current = false;
      });
      setPulsing(true);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      pulseTimer.current = setTimeout(() => setPulsing(false), PULSE_SETTLE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
    };
  }, []);

  if (!hydrated || !profileHydrated || isSelf) return null;

  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const account = resolveAccount(accountId, userAccount);
  // Per privacy, uno "Sconosciuto" non ti mostra i suoi post nemmeno sul proprio profilo —
  // vedi KnowPanel: qui, non solo su Vitaeworld.
  const known = knownAccountIds.includes(accountId);
  const accountPosts = known && !mutedAccountIds.includes(accountId) ? posts.filter((p) => p.authorId === accountId && !p.isStory && !hiddenPostIds.includes(p.id)) : [];
  const latestMoodId = accountPosts[0]?.moodId ?? "normale";
  const moodColor = allMoods.find((m) => m.id === latestMoodId)?.color ?? "#8B90A8";

  return (
    // La Vetrina deve partire da sotto il notch: "Indietro" non sta più in flusso sopra di
    // lei (la spingeva più in basso) — diventa un cerchio flottante ancorato al safe-area,
    // sovrapposto al bordo della Vetrina. Sfuma via mano a mano che il riquadro raccolto
    // (con la sua propria freccia) prende il suo posto durante lo scroll.
    <div className="relative mx-auto min-h-screen w-full max-w-xl pb-28">
      <button
        onClick={() => router.back()}
        aria-label="Indietro"
        style={{ opacity: Math.max(0, 1 - progress * 4) }}
        className="focus-ring glass-strong absolute left-5 top-[max(env(safe-area-inset-top),0.9rem)] z-20 flex h-9 w-9 items-center justify-center rounded-full text-ink-300 hover:text-ink-100"
      >
        <ArrowLeft size={16} />
      </button>

      <CollapsedProfileBar
        progress={progress}
        pulsing={pulsing}
        onBack={() => router.back()}
        avatarUrl={account.avatarUrl}
        nickname={account.nickname}
        moodColor={moodColor}
      />

      <ProfileHeader account={account} isOwner={false} posts={posts} collapseProgress={progress} />

      <div className="mt-7 space-y-5 px-5 sm:px-6">
        {accountPosts.length === 0 && !known && (
          <p className="mt-10 text-center text-sm text-ink-800">
            Conosci prima @{account.nickname} per vedere i suoi post.
          </p>
        )}
        {accountPosts.length === 0 && known && (
          <p className="mt-10 text-center text-sm text-ink-800">@{account.nickname} non ha ancora pubblicato nulla.</p>
        )}
        {accountPosts.map((post) => (
          <PostCard key={post.id} post={post} onOpenComments={() => setCommentsFor(post)} onShare={() => setSharingPost(post)} />
        ))}
      </div>

      {commentsFor && <PostComments post={posts.find((p) => p.id === commentsFor.id) ?? commentsFor} onClose={() => setCommentsFor(null)} />}
      {sharingPost && <ShareComposer post={posts.find((p) => p.id === sharingPost.id) ?? sharingPost} onClose={() => setSharingPost(null)} />}
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
