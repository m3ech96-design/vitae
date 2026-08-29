"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Aperture, MessageSquare } from "lucide-react";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";

/**
 * Il riquadro che decide cosa vedi di un altro account: "Persona Conosciuta" con "Chat"
 * accanto, "Sconosciuto" con "Inizia A Conoscere" a sinistra, o — solo quando quell'account
 * ti ha già mandato una richiesta — "Accetta"/"Accetta E Conosci Anche Tu". Largo quasi
 * quanto lo schermo apposta (stesso breakout della Vetrina, `w-screen` con margini negativi
 * sul viewport): rompe il colore ambra del tema esattamente come richiesto, non solo la
 * larghezza.
 */
export function KnowPanel({ accountId }: { accountId: string }) {
  const router = useRouter();
  const { knownAccountIds, sentRequests, receivedRequests, sendKnowRequest, acceptKnowRequest } = useVitaecomSocial();
  const [revealed, setRevealed] = useState(false);
  const [justAccepted, setJustAccepted] = useState(false);

  const known = knownAccountIds.includes(accountId);
  const pendingReceived = receivedRequests.includes(accountId);
  const pendingSent = sentRequests.includes(accountId);

  const handleAccept = () => {
    acceptKnowRequest(accountId);
    setJustAccepted(true);
    setTimeout(() => setJustAccepted(false), 2200);
  };

  return (
    <div className="relative w-screen mx-[calc(50%-50vw)] border-y border-[#B79A6B]/25 bg-[#B79A6B]/[0.07] px-6 py-4">
      <div className="mx-auto max-w-xl">
        <AnimatePresence mode="wait" initial={false}>
          {justAccepted ? (
            <motion.p
              key="accepted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-[#B79A6B]"
            >
              Accettato!
            </motion.p>
          ) : pendingReceived ? (
            <motion.div key="accept" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2.5">
              <button
                onClick={handleAccept}
                className="focus-ring flex-1 rounded-full border border-[#B79A6B]/50 bg-[#B79A6B]/15 py-2.5 text-center text-sm text-ink-100 transition hover:bg-[#B79A6B]/25"
              >
                Accetta
              </button>
              <button
                onClick={handleAccept}
                className="focus-ring flex-1 rounded-full border border-[#B79A6B]/50 bg-[#B79A6B]/15 py-2.5 text-center text-sm text-ink-100 transition hover:bg-[#B79A6B]/25"
              >
                Accetta E Conosci Anche Tu
              </button>
            </motion.div>
          ) : known ? (
            <motion.div key="known" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between gap-3">
              <span className="flex-1 text-sm text-ink-200">Persona Conosciuta</span>
              <button
                onClick={() => router.push(`/vitaecom/chat/${accountId}`)}
                className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#B79A6B]/50 bg-[#B79A6B]/15 py-2.5 text-sm text-ink-100 transition hover:bg-[#B79A6B]/25"
              >
                <MessageSquare size={14} /> Chat
              </button>
            </motion.div>
          ) : (
            <motion.div key="unknown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2.5">
              {!pendingSent && (
                <button
                  onClick={() => (revealed ? sendKnowRequest(accountId) : setRevealed(true))}
                  className="focus-ring flex items-center gap-1.5 rounded-full border border-[#B79A6B]/50 bg-[#B79A6B]/15 px-3.5 py-2.5 text-sm text-ink-100 transition hover:bg-[#B79A6B]/25"
                >
                  <Aperture size={14} className="shrink-0" />
                  <motion.span
                    initial={false}
                    animate={{ width: revealed ? "auto" : 0, opacity: revealed ? 1 : 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Inizia A Conoscere
                  </motion.span>
                </button>
              )}
              <span className="text-sm text-ink-600">{pendingSent ? "Richiesta Inviata" : "Sconosciuto"}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
