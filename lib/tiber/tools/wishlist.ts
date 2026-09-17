import { TiberToolDefinition, ctxField, TiberExecutionContext } from "../tool-types";
import { WishlistItem } from "@/lib/wishlist-types";

interface WishlistCtx {
  items: WishlistItem[];
  addItem: (input: Omit<WishlistItem, "id" | "createdAt" | "savedAmount">) => WishlistItem;
  updateItem: (id: string, patch: Partial<Omit<WishlistItem, "id" | "createdAt">>) => void;
  removeItem: (id: string) => void;
  fulfillItem: (id: string, amount: number) => void;
  unfulfillItem: (id: string) => void;
}

function wishlistCtx(ctx: TiberExecutionContext): WishlistCtx {
  return ctxField<WishlistCtx>(ctx, "wishlist");
}

function findItemByName(items: WishlistItem[], name: string): WishlistItem | undefined {
  const needle = name.trim().toLowerCase();
  return (
    items.find((i) => i.name.trim().toLowerCase() === needle) ??
    items.find((i) => i.name.trim().toLowerCase().includes(needle))
  );
}

export const wishlistTools: Record<string, TiberToolDefinition> = {
  aggiungi_a_wishlist: {
    declaration: {
      name: "aggiungi_a_wishlist",
      description: "Aggiunge un nuovo articolo alla Wishlist.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome dell'articolo." },
          price: { type: "NUMBER", description: "Prezzo in euro, se noto." },
          siteUrl: { type: "STRING", description: "URL del prodotto, se noto." },
        },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { addItem } = wishlistCtx(ctx);
      const created = addItem({ name: String(args.name), details: [], price: args.price !== undefined ? Number(args.price) : null, siteUrl: args.siteUrl ? String(args.siteUrl) : undefined });
      return `"${created.name}" aggiunto alla Wishlist.`;
    },
  },

  modifica_wishlist: {
    declaration: {
      name: "modifica_wishlist",
      description: "Modifica nome, prezzo o URL di un articolo Wishlist esistente, cercandolo per nome.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome (anche parziale) attuale dell'articolo." },
          newName: { type: "STRING", description: "Nuovo nome, se da cambiare." },
          price: { type: "NUMBER", description: "Nuovo prezzo in euro." },
          siteUrl: { type: "STRING", description: "Nuovo URL." },
        },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { items, updateItem } = wishlistCtx(ctx);
      const item = findItemByName(items, String(args.name));
      if (!item) return `Non ho trovato nessun articolo con nome simile a "${args.name}".`;
      const patch: Partial<WishlistItem> = {};
      if (args.newName) patch.name = String(args.newName);
      if (args.price !== undefined) patch.price = Number(args.price);
      if (args.siteUrl) patch.siteUrl = String(args.siteUrl);
      updateItem(item.id, patch);
      return `"${item.name}" aggiornato.`;
    },
  },

  segna_wishlist_esaudito: {
    declaration: {
      name: "segna_wishlist_esaudito",
      description: "Segna un articolo Wishlist come acquistato/esaudito, cercandolo per nome.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Nome (anche parziale) dell'articolo." },
          amount: { type: "NUMBER", description: "Importo speso per acquistarlo." },
        },
        required: ["name", "amount"],
      },
    },
    execute: (args, ctx) => {
      const { items, fulfillItem } = wishlistCtx(ctx);
      const item = findItemByName(items, String(args.name));
      if (!item) return `Non ho trovato nessun articolo con nome simile a "${args.name}".`;
      fulfillItem(item.id, Number(args.amount));
      return `"${item.name}" segnato come acquistato per ${Number(args.amount).toLocaleString("it-IT")}€.`;
    },
  },

  riapri_wishlist: {
    declaration: {
      name: "riapri_wishlist",
      description: "Riapre un articolo Wishlist già esaudito, tornando a monitorare il risparmio verso di esso.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) dell'articolo." } },
        required: ["name"],
      },
    },
    execute: (args, ctx) => {
      const { items, unfulfillItem } = wishlistCtx(ctx);
      const item = findItemByName(items, String(args.name));
      if (!item) return `Non ho trovato nessun articolo con nome simile a "${args.name}".`;
      unfulfillItem(item.id);
      return `"${item.name}" riaperto.`;
    },
  },

  elenca_wishlist: {
    declaration: {
      name: "elenca_wishlist",
      description: "Elenca gli articoli in Wishlist con prezzo e quota risparmiata.",
      parameters: { type: "OBJECT", properties: {} },
    },
    execute: (_args, ctx) => {
      const { items } = wishlistCtx(ctx);
      if (items.length === 0) return "Nessun articolo in Wishlist.";
      return items.map((i) => `${i.name}${i.price ? ` (${i.price}€` : " (prezzo non noto"}, risparmiati ${i.savedAmount}€)`).join("; ");
    },
  },

  elimina_da_wishlist: {
    declaration: {
      name: "elimina_da_wishlist",
      description: "Elimina definitivamente un articolo dalla Wishlist, cercandolo per nome. Azione distruttiva.",
      parameters: {
        type: "OBJECT",
        properties: { name: { type: "STRING", description: "Nome (anche parziale) dell'articolo da eliminare." } },
        required: ["name"],
      },
    },
    destructive: true,
    execute: (args, ctx) => {
      const { items, removeItem } = wishlistCtx(ctx);
      const item = findItemByName(items, String(args.name));
      if (!item) return `Non ho trovato nessun articolo con nome simile a "${args.name}".`;
      removeItem(item.id);
      return `"${item.name}" eliminato dalla Wishlist.`;
    },
  },
};
