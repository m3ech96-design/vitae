/**
 * Estrae N fotogrammi campionati lungo la durata di un video, per l'anteprima "che scorre"
 * richiesta ("come quando metti il cursore del mouse su una miniatura di un video di
 * YouTube, ma che pesca più parti dallo stesso video").
 *
 * Adattamento dichiarato: l'originale descrive un effetto ad hover del mouse, ma questa è
 * prima di tutto un'app da telefono — un dito che tocca lo schermo non genera hover. Invece
 * di un effetto che su mobile semplicemente non scatterebbe mai, i fotogrammi campionati
 * scorrono in un ciclo continuo, automaticamente, mentre la miniatura è visibile a schermo
 * (vedi use-video-scrub-preview.ts) — funziona identico su telefono e desktop, resta fedele
 * all'idea ("più parti dello stesso video" che si susseguono), ed è comunque interrompibile:
 * l'interruttore richiesto ("sceglibile o no") lo disattiva del tutto se preferisci una
 * miniatura ferma.
 */
export async function extractVideoFrames(videoUrl: string, count = 4): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoUrl;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const frames: string[] = [];
    let index = 0;
    let duration = 0;
    let settled = false;

    const finish = (result: string[]) => {
      if (settled) return;
      settled = true;
      video.src = "";
      resolve(result);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      video.src = "";
      reject(err);
    };

    const captureFrame = () => {
      if (!ctx) return fail(new Error("Canvas non disponibile"));
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.6));
      index++;
      if (index < count) {
        video.currentTime = (duration * (index + 0.5)) / count;
      } else {
        finish(frames);
      }
    };

    video.onloadedmetadata = () => {
      duration = video.duration || 0;
      if (!duration || !Number.isFinite(duration)) {
        finish([]);
        return;
      }
      video.currentTime = duration * (0.5 / count);
    };
    video.onseeked = captureFrame;
    video.onerror = () => fail(new Error("Impossibile leggere il video"));

    // Un video corrotto o irraggiungibile non deve bloccare la UI per sempre.
    setTimeout(() => finish(frames), 8000);
  });
}

/** Cache in memoria per non ricalcolare gli stessi fotogrammi ogni volta che una card
 * rientra nello schermo durante lo scroll — i video del Diario non cambiano una volta
 * salvati, quindi il risultato per una data chiave resta valido per tutta la sessione. */
const frameCache = new Map<string, Promise<string[]>>();

export function getCachedVideoFrames(videoUrl: string, count = 4): Promise<string[]> {
  const cacheKey = `${videoUrl}::${count}`;
  let cached = frameCache.get(cacheKey);
  if (!cached) {
    cached = extractVideoFrames(videoUrl, count).catch(() => []);
    frameCache.set(cacheKey, cached);
  }
  return cached;
}
