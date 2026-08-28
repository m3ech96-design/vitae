import { VitaegramAccount, VitaegramTag } from "./vitaegram-social-types";
import { DEMO_ACCOUNTS } from "./vitaegram-demo-data";

/** L'utente vero + gli account dimostrativi (vedi vitaegram-demo-data.ts) — un solo posto
 * dove risolvere "di chi è questo post/commento/tag", finché non esiste un vero elenco account. */
export function resolveAccount(id: string, userAccount: VitaegramAccount): VitaegramAccount {
  if (id === "user") return userAccount;
  return DEMO_ACCOUNTS.find((a) => a.id === id) ?? { id, nickname: "Account Rimosso" };
}

export function resolveTaggedAccounts(tags: VitaegramTag[], userAccount: VitaegramAccount): VitaegramAccount[] {
  return tags.map((t) => resolveAccount(t.accountId, userAccount));
}
