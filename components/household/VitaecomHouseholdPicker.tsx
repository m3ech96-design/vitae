"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Check, Pencil } from "lucide-react";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { useHousehold } from "@/lib/household-context";
import { DEMO_ACCOUNTS } from "@/lib/vitaecom-demo-data";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { capitalizeWords } from "@/lib/text";

/**
 * Aggiorna direttamente il Nome e Cognome della Persona di Mondo creata dal ponte
 * Vitaecom↔Mondo (vedi `vitaecomAccountId` su Person) — lo stesso identico dato che vedresti
 * aprendo la sua scheda Scoperte, non più un elenco separato: conoscere qualcuno su Vitaecom
 * crea sempre questa Persona (vedi l'effect in vitaecom-social-context.tsx), qui la si
 * completa solo più in fretta, senza uscire dal riquadro Casa.
 */
function NameQuickEntry({ personId, onSaved }: { personId: string; onSaved: () => void }) {
  const { updatePerson } = useHousehold();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const save = () => {
    if (!firstName.trim()) return;
    updatePerson(personId, { firstName: capitalizeWords(firstName.trim()), lastName: capitalizeWords(lastName.trim()) });
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
 * "Scegli" in basso a destra; "Scegli" controlla che tu conosca davvero il suo nome (non
 * solo il nickname, con cui la sua Persona in Mondo parte per forza compilata) — se no,
 * l'errore compare qui accanto con un modo rapido per rimediare sul posto, invece di
 * mandarti altrove e farti perdere il filo.
 */
export function VitaecomHouseholdPicker({ onClose }: { onClose: () => void }) {
  const { knownAccountIds, personIdForAccount, householdMembers, householdSentRequests, sendHouseholdRequest } = useVitaecomSocial();
  const { people } = useHousehold();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);

  const candidates = DEMO_ACCOUNTS.filter((a) => knownAccountIds.includes(a.id));

  const knownFullName = (accountId: string, nickname: string) => {
    const person = people.find((p) => p.id === personIdForAccount(accountId));
    // "Conosciuto il nome" per davvero solo quando differisce dal nickname di partenza —
    // altrimenti ogni Persona appena creata passerebbe subito il controllo, svuotandolo.
    if (!person || !person.firstName.trim() || person.firstName === nickname) return null;
    return `${person.firstName} ${person.lastName}`.trim();
  };

  const confirmChoice = (accountId: string, nickname: string) => {
    if (!knownFullName(accountId, nickname)) {
      setError(accountId);
      setEditingName(false);
      return;
    }
    sendHouseholdRequest(accountId);
    onClose();
  };
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex max-h-[80dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
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
              Non conosci ancora nessuno su Vitaecom — vedi la scheda &quot;Chat&quot; per iniziare a conoscere qualcuno.
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
                      {knownFullName(a.id, a.nickname) && (
                        <p className="truncate text-xs text-ink-800">{knownFullName(a.id, a.nickname)}</p>
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
                          confirmChoice(a.id, a.nickname);
                        }}
                        className="focus-ring rounded-full border border-[#B79A6B]/50 bg-[#B79A6B]/15 px-4 py-1.5 text-xs text-ink-100 transition hover:bg-[#B79A6B]/25"
                      >
                        Scegli
                      </button>
                    </motion.div>
                  )}
                  {isSelected && error === a.id && editingName && personIdForAccount(a.id) && (
                    <NameQuickEntry personId={personIdForAccount(a.id)!} onSaved={() => setError(null)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
