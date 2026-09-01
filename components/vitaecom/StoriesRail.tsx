"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { groupActiveStories } from "@/lib/vitaecom-stories";
import { AuraAvatar } from "../ui/AuraAvatar";
import { StoryComposer } from "./StoryComposer";
import { StoryViewer } from "./StoryViewer";

/**
 * La fila di cerchietti in cima a Vitaeworld — solo per chi ha almeno una storia ancora
 * attiva (scomparse da sole dopo 24 ore, vedi lib/vitaecom-stories.ts). Il tuo, per primo,
 * con un "+" per aggiungerne una nuova anche quando ne hai già una attiva; un anello acceso
 * per chi ha qualcosa che non hai ancora visto, spento per chi hai già visto per intero.
 */
export function StoriesRail() {
  const { profile } = useProfile();
  const { posts, seenStoryIds, knownAccountIds } = useVitaecomSocial();
  const [composerOpen, setComposerOpen] = useState(false);
  const [viewerAuthorIndex, setViewerAuthorIndex] = useState<number | null>(null);

  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };
  // Stessa regola di privacy dei post: uno "Sconosciuto" non mostra nulla di suo da nessuna
  // parte (vedi KnowPanel) — qui nemmeno una storia. La tua resta sempre visibile a te.
  const groups = groupActiveStories(posts).filter((g) => g.authorId === "user" || knownAccountIds.includes(g.authorId));
  const myGroupIndex = groups.findIndex((g) => g.authorId === "user");
  const otherGroups = groups.filter((g) => g.authorId !== "user");
  const orderedGroups = myGroupIndex >= 0 ? [groups[myGroupIndex], ...otherGroups] : otherGroups;

  return (
    <>
      <div className="flex gap-3.5 overflow-x-auto pb-1 pt-1">
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <span className="relative inline-flex">
            <button
              onClick={() => (myGroupIndex >= 0 ? setViewerAuthorIndex(0) : setComposerOpen(true))}
              className="focus-ring rounded-full"
              aria-label="Le tue storie"
            >
              <AuraAvatar imageUrl={userAccount.avatarUrl} firstName={userAccount.nickname} size={58} ring={myGroupIndex >= 0 ? "world" : "none"} />
            </button>
            <button
              onClick={() => setComposerOpen(true)}
              className="focus-ring absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-void-950 bg-[#B79A6B] text-void-950"
              aria-label="Aggiungi una storia"
            >
              <Plus size={11} strokeWidth={3} />
            </button>
          </span>
          <span className="max-w-[60px] truncate text-[10px] text-ink-600">Tu</span>
        </div>

        {otherGroups.map((group, i) => {
          const account = resolveAccount(group.authorId, userAccount);
          const allSeen = group.stories.every((s) => seenStoryIds.includes(s.id));
          return (
            <button
              key={group.authorId}
              onClick={() => setViewerAuthorIndex(orderedGroups.findIndex((g) => g.authorId === group.authorId))}
              className="focus-ring flex shrink-0 flex-col items-center gap-1.5"
            >
              <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={58} ring={allSeen ? "none" : "world"} />
              <span className="max-w-[60px] truncate text-[10px] text-ink-600">{account.nickname}</span>
            </button>
          );
        })}
      </div>

      {composerOpen && <StoryComposer onClose={() => setComposerOpen(false)} />}
      {viewerAuthorIndex !== null && (
        <StoryViewer groups={orderedGroups} startAuthorIndex={viewerAuthorIndex} onClose={() => setViewerAuthorIndex(null)} />
      )}
    </>
  );
}
