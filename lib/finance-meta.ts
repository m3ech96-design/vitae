import {
  Home,
  UtensilsCrossed,
  Car,
  HeartPulse,
  PartyPopper,
  RefreshCw,
  ShoppingBag,
  Receipt,
  Wrench,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { ExpenseCategory, PlaceType } from "./types";

export interface ExpenseCategoryMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, ExpenseCategoryMeta> = {
  casa: { label: "Casa", color: "#7C5CFF", icon: Home },
  cibo: { label: "Cibo", color: "#34D399", icon: UtensilsCrossed },
  trasporti: { label: "Trasporti", color: "#5EC8FF", icon: Car },
  salute: { label: "Salute", color: "#00E5C7", icon: HeartPulse },
  svago: { label: "Svago", color: "#FF6B9D", icon: PartyPopper },
  abbonamenti: { label: "Abbonamenti", color: "#FFB454", icon: RefreshCw },
  shopping: { label: "Shopping", color: "#C77DFF", icon: ShoppingBag },
  bollette: { label: "Bollette", color: "#FF4D6D", icon: Receipt },
  servizi: { label: "Servizi", color: "#8FA3C7", icon: Wrench },
  altro: { label: "Altro", color: "#8B90A8", icon: MoreHorizontal },
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[];

/** Le spese raccolte in automatico da Task/Luoghi ereditano una categoria dal tipo di luogo. */
export const PLACE_TYPE_TO_CATEGORY: Partial<Record<PlaceType, ExpenseCategory>> = {
  ristorante: "cibo",
  bar: "svago",
  supermercato: "cibo",
  negozio: "shopping",
  servizio: "servizi",
};
