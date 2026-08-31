"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Pencil } from "lucide-react";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { DEMO_ACCOUNTS } from "@/lib/vitaecom-demo-data";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { capitalizeWords } from "@/lib/text";

/**
 * Il "wizard delle scoperte" minimo applicato direttamente a un account Vitaecom (vedi
 * knownNames in vitaecom-social-context.tsx): oggi è solo Nome e Cognome, il minimo che
 * questa richiesta specifica serve a verificare — non l'intera scheda a sei sezioni, che
 * avrà senso costruire quando Mondo e Persone si uniranno per davvero.
 */
function NameQuickEntry({ accountId, onSaved }: { accountId: string; onSaved: () => void }) {
  const { setKnownName } = useVitaecomSocial();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const save = () => {
    if (!firstName.trim()) return;
    setKnownName(accountId, capitalizeWords(firstName.trim()), capitalizeWords(lastName.trim()));
    onSaved();
  };

  return (
    <div className="mt-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="Nome"
        className="focus-ring w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-ink-100 placeholder:text-ink-800"
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Cognome"
        className="focus-ring w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-ink-100 placeholder:text-ink-800"
      />
      <button
        onClick={save}
        disabled={!firstName.trim()}
        className="focus-ring flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-aura-violet/50 text-aura-violet disabled:opacity-30"
        aria-label="Salva nome"
      >
        <Check size={13} />
      </button>
    </div>
  );
}

/**
 * "Da Vitaecom" — sceglie, tra le persone conosciute, chi invitare nel riquadro casa. Una
 * card toccata si inspessisce (bordo/sfondo più marcati) per dare spazio al pulsante
 * "Scegli" in basso a destra; "Scegli" controlla che tu conosca almeno il suo nome — se no,
 * l'errore compare qui accanto con un modo rapido per rimediare sul posto, invece di
 * mandarti altrove e farti perdere il filo.
 */
export function VitaecomHouseholdPicker({ onClose }: { onClose: () => void }) {
  const { knownAccountIds, knownNames, householdMembers, householdSentRequests, sendHouseholdRequest } = useVitaecomSocial();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);

  const candidates = DEMO_ACCOUNTS.filter((a) => knownAccountIds.includes(a.id));

  const confirmChoice = (accountId: string) => {
    if (!knownNames[accountId]?.firstName) {
      setError(accountId);
      setEditingName(false);
      return;
    }
    sendHouseholdRequest(accountId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">Da Vitaecom</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>
        <p className="shrink-0 px-6 pt-2 text-xs text-ink-800">Scegli una persona conosciuta da invitare nel tuo riquadro casa.</p>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
          {candidates.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-800">
              Non conosci ancora nessuno su Vitaecom — vedi la scheda &quot;Persone&quot;.
            </p>
          )}
          <div className="space-y-2.5">
            {candidates.map((a) => {
              const isSelected = selectedId === a.id;
              const already = householdMembers.includes(a.id);
              const pending = householdSentRequests.includes(a.id);
              return (
                <div
                  key={a.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => !already && !pending && setSelectedId(isSelected ? null : a.id)}
                  className={`rounded-xl2 border p-3.5 transition-all ${
                    already || pending
                      ? "border-white/[0.06] bg-white/[0.01] opacity-50"
                      : isSelected
                      ? "border-[#B79A6B]/60 bg-[#B79A6B]/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AuraAvatar imageUrl={a.avatarUrl} firstName={a.nickname} size={44} ring="idle" glowColor="#B79A6B" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-100">@{a.nickname}</p>
                      {knownNames[a.id]?.firstName && (
                        <p className="truncate text-xs text-ink-800">
                          {knownNames[a.id].firstName} {knownNames[a.id].lastName}
                        </p>
                      )}
                      {already && <p className="text-xs text-ink-800">Già nella tua casa</p>}
                      {pending && <p className="text-xs text-ink-800">Richiesta inviata…</p>}
                    </div>
                  </div>

                  {isSelected && !already && !pending && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 flex items-center justify-end gap-2"
                    >
                      {error === a.id && !editingName && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingName(true);
                          }}
                          className="focus-ring flex items-center gap-1 text-[11px] text-aura-pink"
                        >
                          <Pencil size={11} /> Devi almeno conoscere il suo nome!
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmChoice(a.id);
                        }}
                        className="focus-ring rounded-full border border-[#B79A6B]/50 bg-[#B79A6B]/15 px-4 py-1.5 text-xs text-ink-100 transition hover:bg-[#B79A6B]/25"
                      >
                        Scegli
                      </button>
                    </motion.div>
                  )}
                  {isSelected && error === a.id && editingName && (
                    <NameQuickEntry accountId={a.id} onSaved={() => setError(null)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
