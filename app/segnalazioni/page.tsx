"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flag, Trash2, Check } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useVitaecomSocial } from "@/lib/vitaecom-social-context";
import { resolveAccount } from "@/lib/vitaecom-resolve";
import { AuraAvatar } from "@/components/ui/AuraAvatar";
import { NicknameGate } from "@/components/vitaecom/NicknameGate";

function timeOf(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * "Segnalazioni" — dove arrivano i post che segnali, solo a te: gli altri account non hanno
 * (e non devono avere) questa scheda, come richiesto esplicitamente. Per questo non vive tra
 * le schede assegnabili della barra di navigazione (lib/nav-slots.ts) insieme a tutte le
 * altre — quelle sono la superficie che un domani, con account reali multipli, sarà la
 * stessa per chiunque; questa no. Si raggiunge da un piccolo pulsante dedicato nel tuo
 * profilo Vitaecom (vedi ProfileHeader, solo quando `isOwner`).
 *
 * Una cosa da dire chiaramente, non da nascondere: oggi questa restrizione è solo
 * "non è nella navigazione normale", non un vero controllo d'accesso — in un'app
 * solo-locale con un solo account reale non ce n'è bisogno. Quando arriveranno account
 * reali multipli tramite un server (vedi il resto del progetto), questa sezione andrà
 * ristretta per davvero lato server, non solo tenuta fuori dai menu: nascondere un link
 * non è mai sicurezza vera.
 */
function Segnalazioni() {
  const router = useRouter();
  const { profile, hydrated: profileHydrated } = useProfile();
  const { hydrated, posts, reports, dismissReport, removePost } = useVitaecomSocial();

  if (!hydrated || !profileHydrated) return null;
  const userAccount = { id: "user", nickname: profile.nickname || profile.firstName, avatarUrl: profile.avatarUrl };

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-[max(env(safe-area-inset-top),2.5rem)] sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Indietro">
          <ArrowLeft size={18} />
        </button>
        <p className="flex items-center gap-2 font-display text-xl text-ink-100">
          <Flag size={17} className="text-aura-pink" /> Segnalazioni
        </p>
      </div>

      {reports.length === 0 ? (
        <p className="mt-12 text-center text-sm text-ink-800">Nessuna segnalazione da esaminare.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {reports.map((report) => {
            const account = resolveAccount(report.authorId, userAccount);
            const post = posts.find((p) => p.id === report.postId);
            return (
              <div key={report.id} className="rounded-xl2 border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2.5">
                  <AuraAvatar imageUrl={account.avatarUrl} firstName={account.nickname} size={28} ring="idle" />
                  <span className="text-sm text-ink-100">{account.nickname}</span>
                  <span className="ml-auto text-[10px] text-ink-800">{timeOf(report.createdAt)}</span>
                </div>
                <p className="mt-2.5 text-xs text-aura-pink">{report.reason}</p>
                {report.note && <p className="mt-1 text-xs text-ink-400">{report.note}</p>}
                {post && <p className="mt-2 line-clamp-2 rounded-lg bg-white/[0.03] p-2.5 text-xs text-ink-600">{post.caption || "(post senza testo)"}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => dismissReport(report.id)}
                    className="focus-ring flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-300 hover:border-white/25"
                  >
                    <Check size={12} /> Segna come esaminata
                  </button>
                  {post && (
                    <button
                      onClick={() => {
                        removePost(post.id);
                        dismissReport(report.id);
                      }}
                      className="focus-ring flex items-center gap-1.5 rounded-full border border-aura-pink/40 px-3 py-1.5 text-xs text-aura-pink hover:bg-aura-pink/[0.08]"
                    >
                      <Trash2 size={12} /> Elimina il post
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SegnalazioniPage() {
  return (
    <NicknameGate>
      <Segnalazioni />
    </NicknameGate>
  );
}
