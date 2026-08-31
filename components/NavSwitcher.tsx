"use client";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { BottomNav } from "./BottomNav";
import { OnlineNav } from "./vitaecom/OnlineNav";
import { ChatInputBar } from "./vitaecom/ChatInputBar";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";

/**
 * Sceglie quale barra mostrare in base al percorso — mai uno stato da tenere sincronizzato
 * a mano. `AnimatePresence` qui sopra è quello che rende visibile il cambio: la barra che
 * esce e quella che entra restano montate insieme per la durata della transizione, cosa che
 * permette alla pillola di ciascuna (vedi il `motion.div` dentro BottomNav/OnlineNav/
 * ChatInputBar) di girare su se stessa mentre l'altra prende il suo posto, invece di sparire
 * e ricomparire di scatto — la stessa identica meccanica vale anche per la barra di testo di
 * una conversazione di Chat, non solo per il cambio offline/online.
 */
export function NavSwitcher() {
  const pathname = usePathname();
  const { knownAccountIds } = useVitaecomSocial();
  const chatMatch = pathname.match(/^\/vitaecom\/chat\/([^/]+)$/);
  // Solo per una Persona Conosciuta esiste davvero una conversazione da scrivere (vedi
  // KnowPanel) — visitare l'indirizzo di una chat con chiunque altro non deve offrire una
  // barra di testo che non porterebbe a nulla.
  const chatAccountId = chatMatch && knownAccountIds.includes(chatMatch[1]) ? chatMatch[1] : null;
  const online = pathname.startsWith("/vitaecom");

  return (
    <AnimatePresence initial={false}>
      {chatAccountId ? (
        <ChatInputBar key="chat" accountId={chatAccountId} />
      ) : online ? (
        <OnlineNav key="online" />
      ) : (
        <BottomNav key="offline" />
      )}
    </AnimatePresence>
  );
}
