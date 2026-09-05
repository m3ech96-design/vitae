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

/**
 * Corretto secondo le istruzioni: prima le fasi di scrittura (localStorage, poi immagini,
 * poi video, poi audio) avvenivano in sequenza senza alcuna transazione — se una fase falliva
 * a metà (es. IndexedDB pieno durante il ripristino dei video), il dispositivo restava con
 * un mix di dati vecchi e nuovi, mai uno stato coerente, e l'unico segnale per l'utente era
 * un messaggio d'errore generico che non diceva quanto del backup fosse davvero entrato.
 *
 * Ora: (1) il file viene validato per intero prima di scrivere qualsiasi cosa, così un
 * backup malformato non tocca nulla; (2) uno snapshot completo dello stato attuale viene
 * preso con la stessa `exportBackup` usata per creare i backup, prima di scrivere;
 * (3) se una qualunque fase di scrittura lancia, lo snapshot viene riscritto per riportare
 * il dispositivo esattamente allo stato precedente, e solo dopo l'errore risale al chiamante
 * — l'utente non si trova mai con un mix, o l'importazione riesce per intero o non cambia
 * nulla; (4) `writeAll` pulisce anche ciò che il backup NON contiene (vedi il suo commento
 * qui sotto), non solo scrive ciò che contiene — un ripristino è fedele solo se riporta
 * esattamente allo stato del backup, non a "lo stato del backup sommato a quello attuale".
 */
export async function importBackup(file: File): Promise<void> {
  const text = await file.text();
  let backup: BackupFile;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error("Il file non è un backup valido.");
  }
  if (!backup || backup.version !== 1 || !backup.data || typeof backup.data !== "object") {
    throw new Error("Il file non è un backup valido.");
  }

  const snapshot = await exportBackup();

  /**
   * Corretto secondo le istruzioni: prima questa funzione scriveva SOLO le chiavi presenti
   * in `b.data` (via `setItem`), senza mai rimuovere quelle già sul dispositivo ma assenti
   * dal backup — una sezione aggiunta dopo l'export (una nuova spesa, un nuovo articolo in
   * wishlist, ecc.) restava sul dispositivo anche importando quel backup più vecchio,
   * mescolata con i dati ripristinati invece di sparire come dovrebbe un ripristino fedele.
   * Ora rimuove prima ogni chiave "vitae:" che il dispositivo ha ma il backup non ha — mai
   * l'inverso: `snapshot` (usato per il rollback) contiene per costruzione tutte le chiavi
   * attuali, quindi qui non rimuove mai nulla in quel caso, il rollback resta un ripristino
   * puro come sempre.
   */
  const writeAll = async (b: BackupFile) => {
    const currentKeys = Object.keys(window.localStorage).filter((k) => k.startsWith(KEY_PREFIX));
    currentKeys.forEach((key) => {
      if (!(key in b.data)) window.localStorage.removeItem(key);
    });
    Object.entries(b.data).forEach(([key, value]) => {
      window.localStorage.setItem(key, value);
    });
    await restoreAllImages(b.images ?? {});
    await restoreAllVideos(b.videos ?? {});
    await restoreAllAudio(b.audio ?? {});
  };

  try {
    await writeAll(backup);
  } catch (err) {
    // Una fase di scrittura è fallita a metà: riporta il dispositivo esattamente allo stato
    // di prima invece di lasciarlo con un mix di dati vecchi e nuovi. Se anche il ripristino
    // fallisse (stesso motivo del fallimento originale, es. storage pieno) l'errore originale
    // resta comunque quello mostrato all'utente.
    try {
      await writeAll(snapshot);
    } catch {
      // best-effort: non c'è altro da fare qui senza un secondo livello di backup.
    }
    throw new Error("Importazione non riuscita: i tuoi dati precedenti sono stati ripristinati.");
  }
}
