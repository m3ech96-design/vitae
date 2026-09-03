import { getAllImages, restoreAllImages } from "./image-store";
import { getAllVideos, restoreAllVideos } from "./video-store";
import { getAllAudio, restoreAllAudio } from "./audio-store";

/** Il prefisso che usa ogni chiave localStorage dell'app (vedi il "vitae:qualcosa" in ogni
 * *-context.tsx) — usato qui sotto per scoprire le chiavi da salvare invece di elencarle a
 * mano una per una. */
const KEY_PREFIX = "vitae:";

/**
 * Corretto secondo le istruzioni: qui c'era prima un elenco fisso (DATA_KEYS) scritto a mano,
 * e ogni volta che una nuova sezione introduceva una propria chiave localStorage (mood,
 * medical, needs, i vari vitaecom-*, nav-slots, e più recenti come body-measurements o
 * weekly-activity-goal) bisognava ricordarsi di aggiungerla qui — 41 chiavi erano rimaste
 * fuori, mai aggiunte quando quei moduli furono costruiti. Un elenco da mantenere a mano è
 * per natura destinato a restare indietro rispetto al codice.
 *
 * La correzione strutturale: invece di elencare le chiavi, il backup adesso le SCOPRE da
 * solo, leggendo tutto ciò che in `localStorage` inizia per "vitae:" (il prefisso che usa
 * ogni context dell'app, senza eccezioni verificate). Una chiave dimenticata in futuro non
 * può più succedere, perché non c'è più un elenco da tenere aggiornato: qualunque nuova
 * sezione aggiunga la propria chiave con questo stesso prefisso finisce nel backup
 * automaticamente, dal primo giorno.
 *
 * Include deliberatamente anche i piccoli flag interni "già mostrato/già seminato" (es.
 * vitae:vitaecom-know-seeded) invece di escluderli come dati "non veri": ripristinando un
 * backup su un dispositivo nuovo senza quei flag, l'app rigenererebbe da capo le notifiche
 * dimostrative già viste e gestite, facendole ricomparire come fossero nuove — un backup
 * fedele deve riportare lo stato esatto di prima, non solo i dati che sembrano "importanti".
 */
function allAppKeys(): string[] {
  return Object.keys(window.localStorage).filter((k) => k.startsWith(KEY_PREFIX));
}

export interface BackupFile {
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
  images: Record<string, string>;
  videos?: Record<string, string>;
  audio?: Record<string, string>;
}

/** Backup completo: dati strutturati (localStorage) + immagini, video e audio (IndexedDB) in
 * un solo file. */
export async function exportBackup(): Promise<BackupFile> {
  const data: Record<string, string> = {};
  allAppKeys().forEach((key) => {
    const v = window.localStorage.getItem(key);
    if (v !== null) data[key] = v;
  });
  const images = await getAllImages();
  const videos = await getAllVideos();
  const audio = await getAllAudio();
  return { version: 1, exportedAt: new Date().toISOString(), data, images, videos, audio };
}

export function downloadBackup(backup: BackupFile) {
  const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vitae-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text();
  let backup: BackupFile;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error("Il file non è un backup valido.");
  }
  if (!backup || backup.version !== 1 || !backup.data) {
    throw new Error("Il file non è un backup valido.");
  }
  Object.entries(backup.data).forEach(([key, value]) => {
    window.localStorage.setItem(key, value);
  });
  if (backup.images) {
    await restoreAllImages(backup.images);
  }
  if (backup.videos) {
    await restoreAllVideos(backup.videos);
  }
  if (backup.audio) {
    await restoreAllAudio(backup.audio);
  }
}
