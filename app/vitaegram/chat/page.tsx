"use client";
import { MessageSquare } from "lucide-react";
import { DEMO_ACCOUNTS } from "@/lib/vitaegram-demo-data";
import { NicknameGate } from "@/components/vitaegram/NicknameGate";
import { AuraAvatar } from "@/components/ui/AuraAvatar";

function ChatList() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center gap-2">
        <MessageSquare size={16} className="text-[#B79A6B]" />
        <p className="font-display text-xs uppercase tracking-[0.28em] text-[#B79A6B]">Chat</p>
      </div>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Conversazioni</h1>
      <p className="mt-1.5 text-xs text-ink-800">
        Senza Un Vero Account Dall&apos;Altra Parte, La Chat Vera Non Può Ancora Funzionare — Ecco Come Si Presenterà.
      </p>

      <div className="mt-6 space-y-2.5">
        {DEMO_ACCOUNTS.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-xl2 border p-3 opacity-60"
            style={{ borderColor: "rgba(183,154,107,0.35)" }}
          >
            <AuraAvatar imageUrl={a.avatarUrl} firstName={a.nickname} size={48} ring="idle" glowColor="#B79A6B" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink-100">{a.nickname}</p>
              <p className="truncate text-xs text-ink-800">Anteprima — Nessun Messaggio Vero Ancora</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <NicknameGate>
      <ChatList />
    </NicknameGate>
  );
}
