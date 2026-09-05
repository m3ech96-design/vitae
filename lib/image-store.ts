const DB_NAME = "vitae-images";
const STORE_NAME = "images";
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

/**
 * Le immagini (avatar, foto, miniature) non vivono più in localStorage come stringhe
 * base64 dirette: saturerebbero la quota (5-10MB per origine) dopo poche decine di foto.
 * Vivono in IndexedDB, che ha un limite molto più ampio; nei dati "leggeri" resta solo
 * una chiave breve che punta a questa immagine.
 */
export async function putImage(dataUrl: string): Promise<string> {
  const key = `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(dataUrl, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return key;
}

export async function getImage(key: string): Promise<string | undefined> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result as string | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export async function deleteImage(key: string): Promise<void> {
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
 * Tutte le coppie chiave/immagine — usato solo per l'esportazione di backup.
 *
 * Corretto secondo le istruzioni: prima questa funzione inghiottiva QUALUNQUE errore (anche
 * un guasto momentaneo di IndexedDB, non solo "il database non esiste") e restituiva un
 * oggetto vuoto — indistinguibile da "l'utente non ha nessuna foto". Un backup poteva quindi
 * dichiararsi riuscito (la spunta verde in BackupSection.tsx) pur non contenendo nessuna
 * immagine, senza alcun avviso. Ora l'errore risale al chiamante (`exportBackup`, che lo fa
 * fallire visibilmente) invece di sparire qui dentro.
 */
export async function getAllImages(): Promise<Record<string, string>> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const result: Record<string, string> = {};
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        result[String(cursor.key)] = cursor.value as string;
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
}

/**
 * Ripristina una mappa chiave/immagine — usato solo dall'importazione di backup.
 *
 * Corretto secondo le istruzioni: prima scriveva solo le chiavi presenti in `images` (via
 * `store.put`), senza mai svuotare lo store — un'immagine aggiunta dopo l'export di un
 * backup restava sul dispositivo anche importando quel backup più vecchio, mescolata con i
 * dati ripristinati invece di sparire come dovrebbe un ripristino fedele. Ora lo store viene
 * svuotato con `clear()` nella STESSA transazione delle scritture (mai una transazione a
 * parte prima): se l'operazione fallisse a metà, IndexedDB la annulla per intero, mai uno
 * store svuotato ma non ancora ripopolato.
 */
export async function restoreAllImages(images: Record<string, string>): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    Object.entries(images).forEach(([key, value]) => store.put(value, key));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Compatibilità con eventuali dati salvati prima di questa migrazione. */
export function isDataUrl(value: string | undefined): value is string {
  return Boolean(value && value.startsWith("data:"));
}
