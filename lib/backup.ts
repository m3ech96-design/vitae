import { getAllImages, restoreAllImages } from "./image-store";
import { getAllVideos, restoreAllVideos } from "./video-store";
import { getAllAudio, restoreAllAudio } from "./audio-store";

const DATA_KEYS = [
  "vitae:profile",
  "vitae:people",
  "vitae:places",
  "vitae:tasks",
  "vitae:feed",
  "vitae:tracking-enabled",
  "vitae:workouts",
  "vitae:weight-entries",
  "vitae:weight-goal",
  "vitae:finance-budget",
  "vitae:finance-recurring",
  "vitae:finance-planned",
  "vitae:finance-single",
  "vitae:finance-goals",
  "vitae:finance-savings",
  // Aggiunte qui perché introdotte in questa stessa sessione (Alimentazione, Wishlist,
  // Diario) — l'elenco sopra era già incompleto rispetto a moduli precedenti (mood, medical,
  // needs, vitaecom-*, nav-slots e altri, mai aggiunti quando furono costruiti): un problema
  // preesistente, dichiarato ma non risolto qui per non allargare lo scope di questo
  // checkpoint a un audit completo del backup.
  "vitae:food-ingredients",
  "vitae:food-entries",
  "vitae:food-water",
  "vitae:food-goals",
  "vitae:wishlist-items",
  "vitae:diary-entries",
  "vitae:diary-scrub-preview",
  "vitae:hobbies",
  "vitae:finance-cycle-start-day",
  "vitae:animal-vaccinations",
  "vitae:animal-medications",
  "vitae:animal-appointments",
  "vitae:animal-reports",
  "vitae:animal-allergies",
  "vitae:animal-weight",
  "vitae:animal-food-products",
  "vitae:household-messages",
  "vitae:home-widgets",
];

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
  DATA_KEYS.forEach((key) => {
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
