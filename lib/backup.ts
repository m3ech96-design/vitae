import { getAllImages, restoreAllImages } from "./image-store";

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
];

export interface BackupFile {
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
  images: Record<string, string>;
}

/** Backup completo: dati strutturati (localStorage) + immagini (IndexedDB) in un solo file. */
export async function exportBackup(): Promise<BackupFile> {
  const data: Record<string, string> = {};
  DATA_KEYS.forEach((key) => {
    const v = window.localStorage.getItem(key);
    if (v !== null) data[key] = v;
  });
  const images = await getAllImages();
  return { version: 1, exportedAt: new Date().toISOString(), data, images };
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
    throw new Error("Il File Non È Un Backup Valido.");
  }
  if (!backup || backup.version !== 1 || !backup.data) {
    throw new Error("Il File Non È Un Backup Valido.");
  }
  Object.entries(backup.data).forEach(([key, value]) => {
    window.localStorage.setItem(key, value);
  });
  if (backup.images) {
    await restoreAllImages(backup.images);
  }
}
