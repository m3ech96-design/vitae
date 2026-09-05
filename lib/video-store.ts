const DB_NAME = "vitae-videos";
const STORE_NAME = "videos";
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
  const mime = header.match(/data:(.*);base64/)?.[1] || "video/mp4";
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
 * Salva un video come Blob nativo in IndexedDB — non più come stringa base64 (bug corretto:
 * un `<video src>` con una data URI molto pesante non viene riprodotto in modo affidabile su
 * diversi browser mobili, in particolare quando il file è più che qualche megabyte; un Blob
 * riprodotto tramite `URL.createObjectURL` funziona sempre, indipendentemente dal peso). Le
 * chiamate a questa funzione ora ricevono direttamente il `File` scelto dall'utente, senza
 * passare da `FileReader.readAsDataURL` prima — un passaggio in meno, non solo più veloce ma
 * anche la causa della riproduzione mancata.
 */
export async function putVideo(file: Blob): Promise<string> {
  const key = `vid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(file, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return key;
}

/** Legge il Blob salvato per la riproduzione live (video player, anteprima che scorre). Se
 * trova ancora una vecchia stringa base64 (dati salvati prima di questa correzione), la
 * converte al volo in Blob — nessun video esistente va perso. */
export async function getVideoBlob(key: string): Promise<Blob | undefined> {
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
 * `getVideoBlob`. */
export async function getVideo(key: string): Promise<string | undefined> {
  const blob = await getVideoBlob(key);
  return blob ? blobToDataUrl(blob) : undefined;
}

export async function deleteVideo(key: string): Promise<void> {
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
 * Tutte le coppie chiave/video in base64 — usato solo per l'esportazione di backup, che
 * viaggia come JSON e quindi ha bisogno di stringhe, non di Blob.
 *
 * Corretto secondo le istruzioni: prima questa funzione inghiottiva QUALUNQUE errore (anche
 * un guasto momentaneo di IndexedDB, non solo "il database non esiste") e restituiva un
 * oggetto vuoto — indistinguibile da "l'utente non ha nessun video". Un backup poteva quindi
 * dichiararsi riuscito (la spunta verde in BackupSection.tsx) pur non contenendo nessun
 * video, senza alcun avviso. Ora l'errore risale al chiamante (`exportBackup`, che lo fa
 * fallire visibilmente) invece di sparire qui dentro.
 */
export async function getAllVideos(): Promise<Record<string, string>> {
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
 * Ripristina una mappa chiave/video in base64 (dal file di backup) — riconvertita in Blob
 * prima di salvarla, così anche i video ripristinati usano da subito il percorso di
 * riproduzione affidabile.
 *
 * Corretto secondo le istruzioni: prima scriveva solo le chiavi presenti in `videos`, senza
 * mai svuotare lo store — un video aggiunto dopo l'export di un backup restava sul
 * dispositivo anche importando quel backup più vecchio, mescolato con i dati ripristinati
 * invece di sparire come dovrebbe un ripristino fedele. Ora lo store viene svuotato con
 * `clear()` nella STESSA transazione delle scritture (mai una transazione a parte prima): se
 * l'operazione fallisse a metà, IndexedDB la annulla per intero, mai uno store svuotato ma
 * non ancora ripopolato.
 */
export async function restoreAllVideos(videos: Record<string, string>): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    Object.entries(videos).forEach(([key, value]) => store.put(dataUrlToBlob(value), key));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
