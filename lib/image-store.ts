const DB_NAME = "vitae-images";
const STORE_NAME = "images";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB Non Disponibile"));
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

/** Tutte le coppie chiave/immagine — usato solo per l'esportazione di backup. */
export async function getAllImages(): Promise<Record<string, string>> {
  try {
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
  } catch {
    return {};
  }
}

/** Ripristina una mappa chiave/immagine — usato solo dall'importazione di backup. */
export async function restoreAllImages(images: Record<string, string>): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    Object.entries(images).forEach(([key, value]) => store.put(value, key));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Compatibilità con eventuali dati salvati prima di questa migrazione. */
export function isDataUrl(value: string | undefined): value is string {
  return Boolean(value && value.startsWith("data:"));
}
