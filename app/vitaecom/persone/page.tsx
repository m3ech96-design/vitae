"use client";
import { Users } from "lucide-react";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";
import { VitaecomAccountCard } from "@/components/vitaecom/VitaecomAccountCard";
import { DEMO_ACCOUNTS } from "@/lib/vitaecom-demo-data";

/**
 * Identica a Mondo nel taglio, ma popolata solo da chi hai davvero "conosciuto" su
 * Vitaecom (vedi KnowPanel/"Inizia A Conoscere") — non i tuoi contatti reali del Mondo,
 * un elenco diverso con una fonte diversa. Niente filtri/ordinamento come in Mondo: con
 * solo account dimostrativi oggi la lista è corta abbastanza da non servirne — una
 * semplificazione dichiarata, non dimenticata.
 */
function PersoneList() {
  const { posts, knownAccountIds, hydrated } = useVitaecomSocial();
  if (!hydrated) return null;

  const knownAccounts = DEMO_ACCOUNTS.filter((a) => knownAccountIds.includes(a.id));

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-[#B79A6B]" />
        <p className="font-display text-xs uppercase tracking-[0.28em] text-[#B79A6B]">Persone</p>
      </div>
      <h1 className="mt-1 font-display text-2xl text-ink-100">Chi conosci su Vitaecom</h1>

      <div className="mt-6 space-y-2.5">
        {knownAccounts.length === 0 && (
          <p className="mt-10 text-center text-sm text-ink-800">
            Non conosci ancora nessuno qui — tocca &quot;inizia a conoscere&quot; sul profilo di un account per
            iniziare.
          </p>
        )}
        {knownAccounts.map((a) => (
          <VitaecomAccountCard key={a.id} account={a} posts={posts} />
        ))}
      </div>
    </div>
  );
}

export default function PersonePage() {
  return (
    <NicknameGate>
      <PersoneList />
    </NicknameGate>
  );
}
