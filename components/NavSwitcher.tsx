"use client";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { BottomNav } from "./BottomNav";
import { OnlineNav } from "./vitaecom/OnlineNav";

/**
 * Sceglie quale barra mostrare in base al percorso — mai uno stato da tenere sincronizzato
 * a mano. `AnimatePresence` qui sopra è quello che rende visibile il cambio: la barra che
 * esce e quella che entra restano montate insieme per la durata della transizione, cosa che
 * permette alla pillola di ciascuna (vedi il `motion.div` dentro BottomNav/OnlineNav) di
 * girare su se stessa mentre l'altra prende il suo posto, invece di sparire e ricomparire di
 * scatto.
 */
export function NavSwitcher() {
  const pathname = usePathname();
  const online = pathname.startsWith("/vitaecom");
  return <AnimatePresence initial={false}>{online ? <OnlineNav key="online" /> : <BottomNav key="offline" />}</AnimatePresence>;
}
