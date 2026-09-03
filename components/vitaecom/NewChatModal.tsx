"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Users, User } from "lucide-react";
import { VitaecomAccount } from "@/lib/vitaecom-social-types";
import { useVitaecomChat } from "@/lib/vitaecom-chat-context";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { PersonalCardSheet } from "@/components/home/PersonalCardSheet";
import { Button } from "@/components/ui/Button";

/**
 * Il pulsante "+" della scheda Chat: singola (apre subito la conversazione, come già faceva
 * il vecchio pulsante "Chat" dal profilo) o di gruppo (scegli almeno due persone conosciute
 * e un nome, poi si apre la conversazione appena creata).
 */
export function NewChatModal({ knownAccounts, onClose }: { knownAccounts: VitaecomAccount[]; onClose: () => void }) {
  const router = useRouter();
  const { createGroup } = useVitaecomChat();
  const [mode, setMode] = useState<"scelta" | "gruppo">("scelta");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const confirmGroup = () => {
    if (selected.length < 2 || !groupName.trim()) return;
    const id = createGroup(groupName, selected);
    onClose();
    router.push(`/vitaecom/chat/gruppo/${id}`);
  };

  return (
    <PersonalCardSheet title={mode === "scelta" ? "Nuova chat" : "Nuovo gruppo"} onClose={onClose}>
      {mode === "scelta" && (
        <div className="space-y-2">
          <p className="mb-3 text-xs text-ink-800">Scegli una persona conosciuta per una chat singola, o crea un gruppo.</p>
          {knownAccounts.length === 0 && (
            <p className="text-center text-sm text-ink-800">Non conosci ancora nessuno — vedi la scheda &quot;persone&quot;.</p>
          )}
          {knownAccounts.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                onClose();
                router.push(`/vitaecom/chat/${a.id}`);
              }}
              className="focus-ring flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-left transition hover:border-white/15"
            >
              <AuraAvatar imageUrl={a.avatarUrl} firstName={a.nickname} size={36} ring="idle" glowColor="#B79A6B" />
              <span className="text-sm text-ink-100">@{a.nickname}</span>
              <User size={14} className="ml-auto text-ink-800" />
            </button>
          ))}
          {knownAccounts.length >= 2 && (
            <button
              onClick={() => setMode("gruppo")}
              className="focus-ring mt-2 flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-3 text-sm text-ink-400 transition hover:border-[#B79A6B]/50 hover:text-ink-100"
            >
              <Users size={15} /> Crea una chat di gruppo
            </button>
          )}
        </div>
      )}

      {mode === "gruppo" && (
        <div>
          <input
            autoFocus
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Nome del gruppo"
            className="focus-ring w-full rounded-xl2 border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-800"
          />
          <p className="mb-2 mt-4 text-xs text-ink-800">Scegli almeno due persone ({selected.length} selezionate)</p>
          <div className="space-y-1.5">
            {knownAccounts.map((a) => {
              const isSelected = selected.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  className={`focus-ring flex w-full items-center gap-3 rounded-xl2 border px-3.5 py-2.5 text-left transition ${
                    isSelected ? "border-[#B79A6B]/50 bg-[#B79A6B]/10" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                  }`}
                >
                  <AuraAvatar imageUrl={a.avatarUrl} firstName={a.nickname} size={32} ring="idle" glowColor="#B79A6B" />
                  <span className="text-sm text-ink-100">@{a.nickname}</span>
                  {isSelected && <Check size={14} className="ml-auto text-[#B79A6B]" />}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1 justify-center" onClick={() => setMode("scelta")}>
              Indietro
            </Button>
            <Button size="sm" className="flex-1 justify-center" onClick={confirmGroup} disabled={selected.length < 2 || !groupName.trim()}>
              Crea gruppo
            </Button>
          </div>
        </div>
      )}
    </PersonalCardSheet>
  );
}
