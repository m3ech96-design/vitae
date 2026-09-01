import { VitaecomPost } from "./vitaecom-social-types";

export const STORY_DURATION_MS = 24 * 60 * 60 * 1000;

export function isStoryActive(post: VitaecomPost, now: number = Date.now()): boolean {
  return Boolean(post.isStory) && Boolean(post.expiresAt) && new Date(post.expiresAt!).getTime() > now;
}

export interface StoryGroup {
  authorId: string;
  stories: VitaecomPost[];
}

/**
 * Le storie ancora attive, raggruppate per autore nell'ordine in cui la più recente di
 * ciascuno è arrivata — così chi ha appena pubblicato compare per primo nella fila, come
 * ci si aspetta, senza dover ordinare due volte (una per l'ordine dei gruppi, una per
 * l'ordine delle storie dentro ciascuno, che restano invece dalla più vecchia alla più
 * nuova: si guardano in quell'ordine, non a ritroso).
 */
export function groupActiveStories(posts: VitaecomPost[], now: number = Date.now()): StoryGroup[] {
  const active = posts.filter((p) => isStoryActive(p, now));
  const byAuthor = new Map<string, VitaecomPost[]>();
  for (const post of active) {
    const list = byAuthor.get(post.authorId) ?? [];
    list.push(post);
    byAuthor.set(post.authorId, list);
  }
  const groups: StoryGroup[] = Array.from(byAuthor.entries()).map(([authorId, stories]) => ({
    authorId,
    stories: stories.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));
  // Il più recente contributo di ciascun autore decide l'ordine dei gruppi.
  groups.sort((a, b) => b.stories[b.stories.length - 1].createdAt.localeCompare(a.stories[a.stories.length - 1].createdAt));
  return groups;
}
