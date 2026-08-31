import {
  Home,
  Briefcase,
  Dumbbell,
  UtensilsCrossed,
  Coffee,
  ShoppingCart,
  Store,
  Landmark,
  Wrench,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { PlaceType } from "./types";

export interface PlaceTypeMeta {
  label: string;
  color: string;
  icon: LucideIcon;
  shape: "circle" | "diamond";
}

export const PLACE_TYPE_META: Record<PlaceType, PlaceTypeMeta> = {
  casa: { label: "Casa", color: "#7C5CFF", icon: Home, shape: "diamond" },
  lavoro: { label: "Lavoro", color: "#FFB454", icon: Briefcase, shape: "circle" },
  palestra: { label: "Palestra", color: "#00E5C7", icon: Dumbbell, shape: "circle" },
  ristorante: { label: "Ristorante", color: "#FF6B9D", icon: UtensilsCrossed, shape: "circle" },
  bar: { label: "Bar", color: "#FF8FB4", icon: Coffee, shape: "circle" },
  supermercato: { label: "Supermercato", color: "#34D399", icon: ShoppingCart, shape: "circle" },
  negozio: { label: "Negozio", color: "#34D399", icon: Store, shape: "circle" },
  culto: { label: "Culto", color: "#5EC8FF", icon: Landmark, shape: "circle" },
  servizio: { label: "Servizio", color: "#5EC8FF", icon: Wrench, shape: "circle" },
  altro: { label: "Altro", color: "#8B90A8", icon: MapPin, shape: "circle" },
};

export const PLACE_TYPES: PlaceType[] = Object.keys(PLACE_TYPE_META) as PlaceType[];

/**
 * Tipi di luogo per cui, al completamento di una task collegata o all'uscita
 * fisica dal luogo (con o senza task), il sistema chiede quanto è stato speso.
 */
export const SPENDING_PLACE_TYPES: PlaceType[] = ["ristorante", "bar", "servizio", "supermercato", "negozio"];
