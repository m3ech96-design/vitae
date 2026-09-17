"use client";
import { AlertTriangle, Check, X, Wrench } from "lucide-react";
import { TiberMessage } from "@/lib/tiber/types";
import { useTiber } from "@/lib/tiber/context";

export function TiberMessageBubble({ message }: { message: TiberMessage }) {
  const { pendingConfirmation, confirmPendingAction, cancelPendingAction } = useTiber();
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-xl2 px-4 py-3 ${isUser ? "bg-aura-gradient text-void-950" : "border border-white/10 bg-white/[0.03] text-ink-100"}`}>
        {message.text && <p className="whitespace-pre-wrap text-sm">{message.text}</p>}

        {message.toolCalls?.map((tc) => (
          <div key={tc.id} className={`${message.text ? "mt-2" : ""} flex flex-col gap-2`}>
            {tc.needsConfirmation && tc.confirmed === undefined ? (
              <div className="flex items-center gap-2 rounded-xl border border-aura-amber/40 bg-aura-amber/10 px-3 py-2 text-xs text-ink-100">
                <AlertTriangle size={14} className="shrink-0 text-aura-amber" />
                <span className="flex-1">Sei sicuro?</span>
                {pendingConfirmation?.toolCall.id === tc.id && (
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={cancelPendingAction}
                      className="focus-ring flex h-7 w-7 items-center justify-center rounded-full border border-white/15 hover:border-aura-pink/50"
                      aria-label="Annulla"
                    >
                      <X size={12} />
                    </button>
                    <button
                      onClick={confirmPendingAction}
                      className="focus-ring flex h-7 w-7 items-center justify-center rounded-full bg-aura-amber text-void-950"
                      aria-label="Conferma"
                    >
                      <Check size={12} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-ink-600">
                <Wrench size={10} className="shrink-0" />
                <span>{tc.result ?? "in corso..."}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
