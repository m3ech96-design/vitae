import { Person, Task, Place } from "./types";
import { VitaegramAccount, VitaegramTag } from "./vitaegram-social-types";
import { DEMO_ACCOUNTS } from "./vitaegram-demo-data";
import { isEmptyAvatar, emptyAvatarLabel } from "./unknown-relative";

export interface ResolvedTag {
  label: string;
  color: string;
  avatarUrl?: string;
  missing?: boolean;
}

export function resolveTag(tag: VitaegramTag, data: { people: Person[]; tasks: Task[]; places: Place[] }): ResolvedTag {
  if (tag.type === "person") {
    const p = data.people.find((x) => x.id === tag.id);
    if (!p) return { label: "Persona Rimossa", color: "#565B77", missing: true };
    return {
      label: isEmptyAvatar(p) ? emptyAvatarLabel(p.kind) : `${p.firstName} ${p.lastName}`.trim(),
      color: "#B79A6B",
      avatarUrl: p.avatarUrl,
    };
  }
  if (tag.type === "place") {
    const pl = data.places.find((x) => x.id === tag.id);
    if (!pl) return { label: "Luogo Rimosso", color: "#565B77", missing: true };
    return { label: pl.name, color: "#5EC8FF", avatarUrl: pl.photoUrl };
  }
  const t = data.tasks.find((x) => x.id === tag.id);
  if (!t) return { label: "Task Rimossa", color: "#565B77", missing: true };
  return { label: t.title, color: t.color };
}

/** L'utente vero + gli account dimostrativi (vedi vitaegram-demo-data.ts) — un solo posto
 * dove risolvere "di chi è questo post/commento", finché non esiste un vero elenco account. */
export function resolveAccount(id: string, userAccount: VitaegramAccount): VitaegramAccount {
  if (id === "user") return userAccount;
  return DEMO_ACCOUNTS.find((a) => a.id === id) ?? { id, nickname: "Account Rimosso" };
}
