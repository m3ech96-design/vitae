import { NextResponse } from "next/server";

/**
 * Il meccanismo di aggiornamento esistente (ServiceWorkerRegister/sw.js) si accorge di una
 * nuova versione solo quando il FILE sw.js cambia byte per byte — la maggior parte dei
 * checkpoint tocca solo componenti React, mai sw.js, quindi per quei checkpoint il banner
 * "nuova versione pronta" non sarebbe mai comparso. Questa rotta dà un secondo segnale,
 * indipendente: Vercel imposta `VERCEL_GIT_COMMIT_SHA` automaticamente ad ogni build/deploy,
 * qualunque cosa sia cambiata — è quello il segnale giusto per "è stato pubblicato un nuovo
 * checkpoint", non un file specifico che potrebbe non essere stato toccato. Vedi
 * lib/app-update-context.tsx per come viene confrontato con il commit già noto.
 *
 * `force-dynamic` impedisce a Next di congelare questa risposta al momento della build (la
 * renderebbe statica, sempre uguale, vanificando lo scopo). In locale (`npm run dev`, dove
 * VERCEL_GIT_COMMIT_SHA non esiste) si usa un valore fisso per la durata del processo: non
 * identifica un vero commit, ma resta stabile finché il server di sviluppo gira, che è tutto
 * ciò che serve per non generare falsi "aggiornamento disponibile" in locale.
 */
export const dynamic = "force-dynamic";

const DEV_INSTANCE_ID = `dev-${Date.now()}`;

export async function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || DEV_INSTANCE_ID;
  return NextResponse.json({ commit });
}
