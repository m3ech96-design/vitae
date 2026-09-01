"use client";
import { useEffect, useRef, useState } from "react";
import { Gem, MessageCircle, Share2, X } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useMood } from "@/lib/mood-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { useResolvedImage } from "@/lib/use-resolved-image";
import { useResolvedVideo } from "@/lib/use-resolved-video";
import { chainRootOf } from "@/lib/vitaecom-lato-stato";
import { StoryGroup } from "@/lib/vitaecom-stories";
import { AuraAvatar } from "../ui/AuraAvatar";
import { LatoStato } from "./LatoStato";
import { MoodPicker } from "./MoodPicker";
import { PostMenu } from "./PostMenu";
import { PostComments } from "./PostComments";
import { ShareComposer } from "./ShareComposer";

const TEXT_PHOTO_DURATION_MS = 6000;
const HOLD_THRESHOLD_MS = 180;

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Ora";
  if (mins < 60) return `${mins}m fa`;
  return `${Math.floor(mins / 60)}h fa`;
}

/**
 * Il visualizzatore a schermo intero verticale delle storie — avanzamento automatico,
 * scorrimento tra le storie della stessa persona e tra persone diverse, e "tutte le
 * interazioni di un post normale" (confermato esplicitamente): Mi Piace, commenti,
 * condivisione, la sfera di reazione con il Lato Stato a schermo intero (stesso
 * componente di ImageViewer), il menu a tre puntini. Una storia è a tutti gli effetti un
 * post — vedi VitaecomPost.isStory — quindi tutte queste interazioni sono le stesse
 * funzioni già usate ovunque altrove, non una riscrittura.
 */
export function StoryViewer({
  groups,
  startAuthorIndex,
  onClose,
}: {
  groups: StoryGroup[];
  startAuthorIndex: number;
  onClose: () => void;
}) {
  const { profile } = useProfile();
  const { allMoods } = useMood();
  const { posts, markStorySeen, toggleLike, setPostReaction } = useVitaecomSocial();
  const [authorIndex, setAuthorIndex] = useState(startAuthorIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);

  const elapsedRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const heldRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  const group = groups[authorIndex];
  const storySeed = group?.stories[storyIndex];
  const post = (storySeed && posts.find((p) => p.id === storySeed.id)) ?? storySeed;
  const account = post ? resolveAccount(post.authorId, userAccount) : userAccount;
  const mood = post ? allMoods.find((m) => m.id === post.moodId) : undefined;
  const photoUrl = useResolvedImage(post?.photoKey) || post?.demoPhotoUrl;
  const videoUrl = useResolvedVideo(post?.videoKey);
  const chainRootId = post ? chainRootOf(post) : "";

  const advance = (direction: 1 | -1) => {
    if (!group) return onClose();
    const nextStoryIndex = storyIndex + direction;
    if (nextStoryIndex >= 0 && nextStoryIndex < group.stories.length) {
      setStoryIndex(nextStoryIndex);
      return;
    }
    const nextAuthorIndex = authorIndex + direction;
    if (nextAuthorIndex >= 0 && nextAuthorIndex < groups.length) {
      setAuthorIndex(nextAuthorIndex);
      setStoryIndex(direction === 1 ? 0 : groups[nextAuthorIndex].stories.length - 1);
      return;
    }
    onClose();
  };

  // Ogni storia parte da zero — sia il proprio progresso, sia il "tempo trascorso" che lo
  // alimenta, altrimenti la storia successiva erediterebbe l'avanzamento della precedente.
  useEffect(() => {
    elapsedRef.current = 0;
    lastTickRef.current = null;
    setProgress(0);
    if (post) markStorySeen(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorIndex, storyIndex, post?.id]);

  // Avanzamento automatico — foto/testo su un tempo fisso, video sulla propria durata reale
  // (vedi onTimeUpdate/onEnded più sotto): qui si occupa solo del primo caso.
  useEffect(() => {
    if (paused || !post || videoUrl || commentsOpen || sharingOpen) return;
    let raf: number;
    const tick = (t: number) => {
      if (lastTickRef.current !== null) elapsedRef.current += t - lastTickRef.current;
      lastTickRef.current = t;
      const p = Math.min(1, elapsedRef.current / TEXT_PHOTO_DURATION_MS);
      setProgress(p);
      if (p >= 1) {
        advance(1);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lastTickRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, authorIndex, storyIndex, videoUrl, commentsOpen, sharingOpen]);

  useEffect(() => {
    const paused2 = paused || commentsOpen || sharingOpen;
    if (!videoRef.current) return;
    if (paused2) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
  }, [paused, commentsOpen, sharingOpen, videoUrl]);

  if (!post) return null;

  const onPointerDown = () => {
    heldRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      heldRef.current = true;
      setPaused(true);
    }, HOLD_THRESHOLD_MS);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (heldRef.current) {
      setPaused(false);
      return;
    }
    const x = e.clientX;
    const third = window.innerWidth / 3;
    if (x < third) advance(-1);
    else advance(1);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black">
      {/* Il livello di tocco sta sotto intestazione e barra delle azioni (z-index più
         basso): un tocco su un pulsante vero viene sempre intercettato da lui, mai da
         questo, per come sono impilati — nessuno stopPropagation necessario. */}
      <div
        className="absolute inset-0 z-0"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => holdTimerRef.current && clearTimeout(holdTimerRef.current)}
      />

      <LatoStato chainRootId={chainRootId} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: i < storyIndex ? "100%" : i === storyIndex ? `${progress * 100}%` : "0%" }}
              />
            </div>
          ))}
        </div>
        <div className="pointer-events-auto mt-2.5 flex items-center gap-2.5">
          <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={30} ring="idle" glowColor={mood?.color} />
          <span className="text-sm text-white">{account.nickname}</span>
          <span className="text-[11px] text-white/60">{timeAgo(post.createdAt)}</span>
          <button onClick={onClose} className="focus-ring ml-auto text-white/80 hover:text-white" aria-label="Chiudi">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex h-full w-full items-center justify-center">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            autoPlay
            className="h-full w-full object-contain"
            onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
            onEnded={() => advance(1)}
          />
        ) : photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center p-10"
            style={{ background: `linear-gradient(160deg, ${mood?.color ?? "#565B77"}55, #0B0D14)` }}
          >
            <p className="text-center font-display text-xl leading-relaxed text-white">{post.caption}</p>
          </div>
        )}
      </div>

      {(photoUrl || videoUrl) && post.caption && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 px-6">
          <p className="text-center text-sm text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{post.caption}</p>
        </div>
      )}

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex items-center gap-4 px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4">
        <button onClick={() => toggleLike(post.id)} className="focus-ring flex items-center gap-1.5" aria-label="Mi piace">
          <Gem size={20} color="#fff" fill={post.likedByUser ? (mood?.color ?? "#fff") : "transparent"} strokeWidth={1.6} />
          {post.likeCount > 0 && <span className="text-xs text-white/80">{post.likeCount}</span>}
        </button>
        <button onClick={() => setCommentsOpen(true)} className="focus-ring flex items-center gap-1.5" aria-label="Commenta">
          <MessageCircle size={20} color="#fff" strokeWidth={1.6} />
          {post.comments.length > 0 && <span className="text-xs text-white/80">{post.comments.length}</span>}
        </button>
        <MoodPicker
          size={20}
          color={allMoods.find((m) => m.id === post.userReactionMoodId)?.color ?? "#ffffff88"}
          onPick={(moodId) => setPostReaction(post.id, moodId)}
          label="Reagisci con uno stato d'animo"
        />
        <button onClick={() => setSharingOpen(true)} className="focus-ring" aria-label="Condividi">
          <Share2 size={19} color="#fff" strokeWidth={1.6} />
        </button>
        <span className="ml-auto">
          <PostMenu postId={post.id} authorId={post.authorId} isOwn={post.authorId === "user"} />
        </span>
      </div>

      {commentsOpen && <PostComments post={post} onClose={() => setCommentsOpen(false)} />}
      {sharingOpen && <ShareComposer post={post} onClose={() => setSharingOpen(false)} />}
    </div>
  );
}
