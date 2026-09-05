const DB_NAME = "vitae-audio";
const STORE_NAME = "audio";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB non disponibile"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*);base64/)?.[1] || "audio/webm";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Salva una nota vocale come Blob nativo in IndexedDB — non più come stringa base64. Stesso
 * bug già corretto in lib/video-store.ts (una data URI molto pesante non viene riprodotta in
 * modo affidabile su diversi browser mobili, specie oltre qualche megabyte), qui però il
 * codice andava nella direzione sbagliata: VoiceRecorderInput già otteneva un Blob nativo dal
 * MediaRecorder, e lo convertiva deliberatamente in data URL solo per salvarlo qui — nessun
 * limite di durata sulla registrazione rendeva concreto, non solo teorico, il rischio che una
 * nota vocale lunga diventasse pesante quanto un video breve. VoiceRecorderInput ora passa
 * direttamente il Blob, senza il giro inutile per FileReader.readAsDataURL.
 */
export async function putAudio(blob: Blob): Promise<string> {
  const key = `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return key;
}

/** Legge il Blob salvato per la riproduzione live. Se trova ancora una vecchia stringa
 * base64 (note vocali salvate prima di questa correzione), la converte al volo in Blob —
 * nessuna nota vocale esistente va persa. */
export async function getAudioBlob(key: string): Promise<Blob | undefined> {
  try {
    const db = await openDb();
    const stored = await new Promise<Blob | string | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (stored === undefined) return undefined;
    return typeof stored === "string" ? dataUrlToBlob(stored) : stored;
  } catch {
    return undefined;
  }
}

/** Compatibilità per chi ha ancora bisogno di una stringa (solo backup/export, che viaggia
 * come JSON e quindi non può contenere un Blob). Per la riproduzione a schermo usare sempre
 * `getAudioBlob`. */
export async function getAudio(key: string): Promise<string | undefined> {
  const blob = await getAudioBlob(key);
  return blob ? blobToDataUrl(blob) : undefined;
}

export async function deleteAudio(key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignorato: la pulizia è un'ottimizzazione, non deve bloccare l'eliminazione dell'entità
  }
}

/**
 * Tutte le coppie chiave/audio in base64 — usato solo per l'esportazione di backup, che
 * viaggia come JSON e quindi ha bisogno di stringhe, non di Blob.
 *
 * Corretto secondo le istruzioni: prima questa funzione inghiottiva QUALUNQUE errore (anche
 * un guasto momentaneo di IndexedDB, non solo "il database non esiste") e restituiva un
 * oggetto vuoto — indistinguibile da "l'utente non ha nessuna nota vocale". Un backup poteva
 * quindi dichiararsi riuscito (la spunta verde in BackupSection.tsx) pur non contenendo
 * nessun audio, senza alcun avviso. Ora l'errore risale al chiamante (`exportBackup`, che lo
 * fa fallire visibilmente) invece di sparire qui dentro.
 */
export async function getAllAudio(): Promise<Record<string, string>> {
  const db = await openDb();
  const raw = await new Promise<Record<string, Blob | string>>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const result: Record<string, Blob | string> = {};
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        result[String(cursor.key)] = cursor.value as Blob | string;
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
  const entries = await Promise.all(
    Object.entries(raw).map(async ([key, value]) => [key, typeof value === "string" ? value : await blobToDataUrl(value)] as const)
  );
  return Object.fromEntries(entries);
}

/**
 * Ripristina una mappa chiave/audio in base64 (dal file di backup) — riconvertita in Blob
 * prima di salvarla, così anche le note vocali ripristinate usano da subito il percorso di
 * riproduzione affidabile.
 *
 * Corretto secondo le istruzioni: prima scriveva solo le chiavi presenti in `audio`, senza
 * mai svuotare lo store — una nota vocale aggiunta dopo l'export di un backup restava sul
 * dispositivo anche importando quel backup più vecchio, mescolata con i dati ripristinati
 * invece di sparire come dovrebbe un ripristino fedele. Ora lo store viene svuotato con
 * `clear()` nella STESSA transazione delle scritture (mai una transazione a parte prima): se
 * l'operazione fallisse a metà, IndexedDB la annulla per intero, mai uno store svuotato ma
 * non ancora ripopolato.
 */
export async function restoreAllAudio(audio: Record<string, string>): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    Object.entries(audio).forEach(([key, value]) => store.put(dataUrlToBlob(value), key));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
