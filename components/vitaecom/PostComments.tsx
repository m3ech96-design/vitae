"use client";
import { useMemo, useState, useEffect } from "react";
import { Gem, CornerDownRight, Send, Pin, Forward } from "lucide-react";
import { VitaecomPost, VitaecomComment } from "@/lib/vitaecom-social-types";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { useProfile } from "@/lib/profile-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useVitaecomDraft } from "@/lib/vitaecom-draft-context";
import { PersonalCardSheet } from "../home/PersonalCardSheet";
import { ForwardComment } from "./ForwardComment";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Ora";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

/**
 * "L'ordine dei commenti è cronologico, ad eccezione degli avatar taggati il cui primo
 * commento di ognuno di loro risulta come 'Posizionato In Alto'... sotto ad un eventuale
 * commento dell'utente che ha pubblicato." Solo il PRIMO commento di ciascuno riceve questo
 * trattamento — i successivi restano nel flusso cronologico normale, mescolati a tutti gli
 * altri. Riguarda solo i commenti di primo livello: le risposte restano sempre agganciate
 * al loro commento padre, in ordine cronologico.
 */
function orderTopLevelComments(comments: VitaecomComment[], authorId: string, taggedIds: Set<string>) {
  const sorted = [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const authorFirst: VitaecomComment[] = [];
  const pinned: VitaecomComment[] = [];
  const rest: VitaecomComment[] = [];
  let authorSeen = false;
  const taggedSeen = new Set<string>();

  sorted.forEach((c) => {
    if (c.authorId === authorId && !authorSeen) {
      authorFirst.push(c);
      authorSeen = true;
    } else if (taggedIds.has(c.authorId) && !taggedSeen.has(c.authorId)) {
      pinned.push(c);
      taggedSeen.add(c.authorId);
    } else {
      rest.push(c);
    }
  });

  return [
    ...authorFirst.map((c) => ({ comment: c, pinned: false })),
    ...pinned.map((c) => ({ comment: c, pinned: true })),
    ...rest.map((c) => ({ comment: c, pinned: false })),
  ];
}

function CommentRow({
  comment,
  post,
  indented,
  pinned,
  onReply,
  onForward,
}: {
  comment: VitaecomComment;
  post: VitaecomPost;
  indented?: boolean;
  pinned?: boolean;
  onReply: (commentId: string) => void;
  onForward: (comment: VitaecomComment) => void;
}) {
  const { profile } = useProfile();
  const { toggleCommentLike } = useVitaecomSocial();
  const account = resolveAccount(comment.authorId, { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl });

  return (
    <div className={indented ? "ml-8 mt-3" : "mt-4"}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-ink-100">
            {account.nickname} <span className="ml-1.5 text-ink-800">{timeAgo(comment.createdAt)}</span>
            {pinned && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] text-[#B79A6B]">
                <Pin size={9} /> Posizionato In Alto
              </span>
            )}
          </p>
          <p className="mt-0.5 text-sm text-ink-200">{comment.text}</p>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <button
          onClick={() => toggleCommentLike(post.id, comment.id, indented ? comment.id : undefined)}
          className="focus-ring flex items-center gap-1 text-ink-800"
        >
          <Gem size={11} fill={comment.likedByUser ? "#B79A6B" : "transparent"} color={comment.likedByUser ? "#B79A6B" : "#565B77"} />
          {comment.likeCount > 0 && <span className="text-[10px]">{comment.likeCount}</span>}
        </button>
        <button onClick={() => onReply(comment.id)} className="focus-ring flex items-center gap-1 text-[10px] text-ink-800">
          <CornerDownRight size={11} /> Rispondi
        </button>
        <button onClick={() => onForward(comment)} className="focus-ring flex items-center gap-1 text-[10px] text-ink-800">
          <Forward size={11} /> Inoltra
        </button>
      </div>
      {comment.replies.map((r) => (
        <CommentRow key={r.id} comment={r} post={post} indented pinned={false} onReply={onReply} onForward={onForward} />
      ))}
    </div>
  );
}

export function PostComments({ post, onClose }: { post: VitaecomPost; onClose: () => void }) {
  const { addComment } = useVitaecomSocial();
  const { draft, setCommentDraft, clearDraft } = useVitaecomDraft();
  const existing = draft?.kind === "comment" && draft.postId === post.id ? draft : undefined;
  const [text, setText] = useState(existing?.text ?? "");
  const [replyTo, setReplyTo] = useState<string | null>(existing?.replyTo ?? null);
  const [forwarding, setForwarding] = useState<VitaecomComment | null>(null);
  const taggedIds = useMemo(() => new Set(post.tags.map((t) => t.accountId)), [post.tags]);
  const ordered = useMemo(() => orderTopLevelComments(post.comments, post.authorId, taggedIds), [post.comments, post.authorId, taggedIds]);

  useEffect(() => {
    if (!text.trim()) return;
    setCommentDraft({ postId: post.id, text, replyTo: replyTo ?? undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, replyTo]);

  const submit = () => {
    if (!text.trim()) return;
    addComment(post.id, text, replyTo ?? undefined);
    setText("");
    setReplyTo(null);
    clearDraft();
  };

  const discardAndClose = () => {
    clearDraft();
    onClose();
  };

  return (
    <>
    <PersonalCardSheet title="Commenti" onClose={discardAndClose}>
      {post.comments.length === 0 && <p className="text-sm text-ink-800">Nessun Commento Ancora — Il Primo Tocca A Te.</p>}
      {ordered.map(({ comment, pinned }) => (
        <CommentRow key={comment.id} comment={comment} post={post} pinned={pinned} onReply={setReplyTo} onForward={setForwarding} />
      ))}
      <div className="sticky bottom-0 mt-5 -mx-6 border-t border-white/10 bg-void-950/95 px-6 pt-3 backdrop-blur">
        {replyTo && (
          <p className="mb-1.5 flex items-center gap-1 text-[10px] text-ink-800">
            <CornerDownRight size={10} /> Stai Rispondendo A Un Commento
            <button onClick={() => setReplyTo(null)} className="ml-1 text-aura-pink">Annulla</button>
          </p>
        )}
        <div className="flex items-center gap-2 pb-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Scrivi Un Commento…"
            className="focus-ring flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
          />
          <button onClick={submit} disabled={!text.trim()} className="focus-ring text-aura-cyan disabled:opacity-30" aria-label="Invia">
            <Send size={18} />
          </button>
        </div>
      </div>
    </PersonalCardSheet>
    {forwarding && <ForwardComment comment={forwarding} post={post} onClose={() => setForwarding(null)} />}
    </>
  );
}
