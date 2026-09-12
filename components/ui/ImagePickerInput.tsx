"use client";
import { useRef } from "react";
import { putImage } from "@/lib/image-store";

/** Selettore immagine senza ritaglio/centratura — a differenza di ImageCropInput, qui
 * l'immagine va salvata così com'è (es. la foto di un esercizio, dove forzare un quadrato
 * ritagliato taglierebbe via parte del movimento mostrato). Stesso principio di
 * VideoPickerInput: legge il file, lo converte in data URL, lo salva in image-store.ts. */
export function ImagePickerInput({
  onChange,
  trigger,
}: {
  onChange: (key: string) => void;
  trigger: (openPicker: () => void) => React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const key = await putImage(reader.result as string);
      onChange(key);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {trigger(() => inputRef.current?.click())}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </>
  );
}
