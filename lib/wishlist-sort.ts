/** Estratto da app/wishlist/page.tsx perché anche Impostazioni (app/impostazioni/page.tsx,
 * sezione "Viste predefinite") ha bisogno di leggere le stesse etichette — importare tipo e
 * costante da un file `page.tsx` altrui avrebbe legato due route tra loro senza motivo, con
 * il rischio di trascinare dentro Impostazioni l'intero modulo della pagina Wishlist. */
export type WishlistSortMode = "recenti" | "meno-recenti" | "prezzo-asc" | "prezzo-desc";

export const WISHLIST_SORT_LABEL: Record<WishlistSortMode, string> = {
  recenti: "Più recenti",
  "meno-recenti": "Meno recenti",
  "prezzo-asc": "Prezzo crescente",
  "prezzo-desc": "Prezzo decrescente",
};
