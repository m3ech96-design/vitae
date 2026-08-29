import { VitaecomAccount, VitaecomTag } from "./vitaecom-social-types";
import { DEMO_ACCOUNTS } from "./vitaecom-demo-data";

/** L'utente vero + gli account dimostrativi (vedi vitaecom-demo-data.ts) — un solo posto
 * dove risolvere "di chi è questo post/commento/tag", finché non esiste un vero elenco account. */
export function resolveAccount(id: string, userAccount: VitaecomAccount): VitaecomAccount {
  if (id === "user") return userAccount;
  return DEMO_ACCOUNTS.find((a) => a.id === id) ?? { id, nickname: "Account Rimosso" };
}

export function resolveTaggedAccounts(tags: VitaecomTag[], userAccount: VitaecomAccount): VitaecomAccount[] {
  return tags.map((t) => resolveAccount(t.accountId, userAccount));
}
