"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Gem, MessageCircle, Share2 } from "lucide-react";
import { VitaecomPost } from "@/lib/vitaecom-social-types";
import { resolveAccount, resolveTaggedAccounts } from "@/lib/vitaecom-resolve";
import { useMood } from "@/lib/mood-context";
import { useProfile } from "@/lib/profile-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { detectLink } from "@/lib/vitaecom-link-detect";
import { chainRootOf } from "@/lib/vitaecom-lato-stato";
import { AuraAvatar } from "../ui/AuraAvatar";
import { TaggedAvatars } from "./TaggedAvatars";
import { LinkEmbed } from "./LinkEmbed";
import { LatoStato } from "./LatoStato";
import { MoodPicker } from "./MoodPicker";
import { PostMenu } from "./PostMenu";
import { ImageViewer } from "./ImageViewer";
import { ReactionOrbit } from "./ReactionOrbit";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Ora";
  if (mins < 60) return `${mins}m Fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h Fa`;
  return `${Math.floor(hours / 24)}g Fa`;
}

/** Un'anteprima compatta di un post incorporato (l'originale, o l'aggiunta del post di
 * provenienza) — mai la card intera con le sue azioni, solo autore + contenuto. */
function EmbeddedPost({
  authorId,
  caption,
  photoUrl,
  videoUrl,
  userAccount,
}: {
  authorId: string;
  caption: string;
  photoUrl?: string;
  videoUrl?: string;
  userAccount: { id: string; nickname: string; avatarUrl?: string };
}) {
  const account = resolveAccount(authorId, userAccount);
  return (
    <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-2">
        <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={22} ring="idle" />
        <span className="text-xs text-ink-200">{account.nickname}</span>
      </div>
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="mt-2 max-h-52 w-full rounded-lg object-cover" />
      )}
      {videoUrl && <video src={videoUrl} controls playsInline preload="metadata" className="mt-2 max-h-52 w-full rounded-lg object-contain bg-black" />}
      {caption && <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-ink-400">{caption}</p>}
    </div>
  );
}

export function PostCard({ post, onOpenComments, onShare }: { post: VitaecomPost; onOpenComments: () => void; onShare: () => void }) {
  const { allMoods, activeMood, shareMoodOnVitaecom } = useMood();
  const { profile } = useProfile();
  const { toggleLike, setPostReaction } = useVitaecomSocial();
  const resolvedPhotoUrl = useResolvedImage(post.photoKey);
  const resolvedVideoUrl = useResolvedVideo(post.videoKey);
  const resolvedEmbedOriginPhoto = useResolvedImage(post.embedOriginPhotoKey);
  const resolvedEmbedOriginVideo = useResolvedVideo(post.embedOriginVideoKey);
  const [orbitMoodId, setOrbitMoodId] = useState<string | null>(null);
  const [justReactedMoodId, setJustReactedMoodId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const reactionButtonRef = useRef<HTMLSpanElement>(null);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const [reactionStartX, setReactionStartX] = useState(0);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => setCardSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const account = resolveAccount(post.authorId, userAccount);
  const isShare = Boolean(post.sharedMoodId);
  // Chi condivide sceglie già il proprio stato d'animo in "Cosa provi?" — non deve poter
  // aggiungerne un secondo con la sfera di reazione sulla propria stessa condivisione.
  const isOwnShare = isShare && post.authorId === "user";
  const mood = allMoods.find((m) => m.id === post.moodId);
  const sharedMood = allMoods.find((m) => m.id === post.sharedMoodId);
  const headerMood = isShare ? sharedMood : mood;
  const color = headerMood?.color ?? "#565B77";
  const taggedAccounts = resolveTaggedAccounts(post.tags, userAccount);
  const photoUrl = resolvedPhotoUrl || post.demoPhotoUrl;
  const link = !photoUrl && !resolvedVideoUrl && !isShare ? detectLink(post.caption) : null;
  const chainRootId = chainRootOf(post);

  const myMood = shareMoodOnVitaecom && activeMood ? allMoods.find((m) => m.id === activeMood.moodId) : undefined;
  const myMoodColor = myMood?.color ?? allMoods.find((m) => m.id === "normale")?.color ?? "#565B77";

  const reactionMood = allMoods.find((m) => m.id === post.userReactionMoodId);
  const reactionColor = reactionMood?.color ?? "#565B77";

  const handleReact = (moodId: string) => {
    setPostReaction(post.id, moodId);
    const cardRect = cardRef.current?.getBoundingClientRect();
    const btnRect = reactionButtonRef.current?.getBoundingClientRect();
    setReactionStartX(cardRect && btnRect ? btnRect.left + btnRect.width / 2 - cardRect.left : cardSize.width * 0.4);
    setOrbitMoodId(moodId);
    // La sfera cammina per ~0.7s in senso orario fino al primo angolo (vedi ReactionOrbit):
    // il Lato Stato si accende esattamente quando lei arriva, non prima né dopo.
    setTimeout(() => setOrbitMoodId(null), 700);
    setTimeout(() => setJustReactedMoodId(moodId), 600);
    setTimeout(() => setJustReactedMoodId(null), 2000);
  };

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-xl2"
      style={{
        borderTop: `1.5px solid ${color}88`,
        borderRight: `1.5px solid ${color}88`,
        borderBottom: `1.5px solid ${color}88`,
        borderLeft: "none",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <LatoStato chainRootId={chainRootId} highlightMoodId={justReactedMoodId} />

      <div className="flex items-center gap-3 p-4 pb-3">
        <Link href={account.id === "user" ? "/vitaecom/profilo" : `/vitaecom/u/${account.id}`} className="focus-ring flex min-w-0 items-center gap-3">
          <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={40} ring="idle" glowColor={color} />
          <div className="min-w-0">
            <p className="truncate text-sm text-ink-100">{account.nickname}</p>
            {headerMood && (
              <p className="text-xs" style={{ color }}>
                {isShare ? `si è sentito/a ${headerMood.label}` : headerMood.label}
              </p>
            )}
          </div>
        </Link>
        <span className="ml-auto shrink-0 text-[10px] text-ink-800">{timeAgo(post.createdAt)}</span>
        <PostMenu postId={post.id} authorId={post.authorId} isOwn={post.authorId === "user"} />
      </div>

      <div className="mx-4 space-y-2.5">
        {isShare && (
          <>
            <EmbeddedPost
              authorId={post.embedOriginAuthorId ?? "user"}
              caption={post.embedOriginCaption ?? ""}
              photoUrl={resolvedEmbedOriginPhoto || post.embedOriginDemoPhotoUrl}
              videoUrl={resolvedEmbedOriginVideo}
              userAccount={userAccount}
            />
            {post.embedSourceCaption && (
              <EmbeddedPost authorId={post.embedSourceAuthorId ?? "user"} caption={post.embedSourceCaption} userAccount={userAccount} />
            )}
          </>
        )}

        <div className="rounded-xl2 border border-white/[0.06] bg-white/[0.015] p-4">
          {photoUrl && !resolvedVideoUrl && !isShare && (
            <div className="relative -mx-4 -mt-4 mb-3 aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="" onClick={() => setViewerOpen(true)} className="h-full w-full cursor-zoom-in object-cover" />
            </div>
          )}
          {resolvedVideoUrl && !isShare && (
            <div className="relative -mx-4 -mt-4 mb-3 aspect-[4/3] overflow-hidden bg-black">
              <video src={resolvedVideoUrl} controls playsInline preload="metadata" className="h-full w-full object-contain" />
            </div>
          )}
          {link && <LinkEmbed link={link} />}
          {post.caption && <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-200">{post.caption}</p>}
          {post.captionByAI && <p className="mt-2 text-[10px] uppercase tracking-wide text-ink-800">Descritto dall&apos;ia</p>}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button onClick={() => toggleLike(post.id)} className="focus-ring flex items-center gap-1.5" aria-label="Mi piace">
            <Gem size={18} color={color} fill={post.likedByUser ? myMoodColor : "transparent"} strokeWidth={1.6} />
            {post.likeCount > 0 && <span className="text-xs text-ink-600">{post.likeCount}</span>}
          </button>
          <button onClick={onOpenComments} className="focus-ring flex items-center gap-1.5" aria-label="Commenta">
            <MessageCircle size={18} color={color} strokeWidth={1.6} />
            {post.comments.length > 0 && <span className="text-xs text-ink-600">{post.comments.length}</span>}
          </button>
          <span ref={reactionButtonRef} className="inline-flex">
            {isOwnShare ? (
              <span title="Hai già scelto il tuo stato d'animo condividendo" aria-label="Reazione già inserita in fase di condivisione">
                <Gem size={17} color={reactionColor} strokeWidth={1.6} />
              </span>
            ) : (
              <MoodPicker size={17} color={reactionColor} onPick={handleReact} label="Reagisci con uno stato d'animo" />
            )}
          </span>
          <button onClick={onShare} className="focus-ring" aria-label="Condividi sulla tua bacheca">
            <Share2 size={17} color="#8B90A8" strokeWidth={1.6} />
          </button>
        </div>
        <TaggedAvatars accounts={taggedAccounts} />
      </div>

      {/* La sfera di reazione: appare sul contorno del post e lo percorre in senso orario
         fino al primo angolo, dove si dissolve — vedi ReactionOrbit.tsx. */}
      {orbitMoodId && cardSize.width > 0 && (
        <ReactionOrbit
          color={allMoods.find((m) => m.id === orbitMoodId)?.color ?? "#8B90A8"}
          width={cardSize.width}
          height={cardSize.height}
          startX={reactionStartX}
        />
      )}

      {viewerOpen && photoUrl && !resolvedVideoUrl && !isShare && (
        <ImageViewer post={post} photoUrl={photoUrl} userAccount={userAccount} onOpenComments={onOpenComments} onShare={onShare} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  );
}
