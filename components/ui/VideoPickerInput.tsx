"use client";
import { useRef } from "react";
import { putVideo } from "@/lib/video-store";

/** Selettore video semplice — a differenza di ImageCropInput non c'è ritaglio/centratura
 * (non ha senso per un video), solo selezione e salvataggio in lib/video-store.ts. Il file
 * scelto va a `putVideo` così com'è, come Blob: non passa più da `FileReader.readAsDataURL`,
 * il passaggio che causava la mancata riproduzione dei video più pesanti. */
export function VideoPickerInput({
  onChange,
  trigger,
}: {
  onChange: (key: string) => void;
  trigger: (openPicker: () => void) => React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const key = await putVideo(file);
    onChange(key);
  };

  return (
    <>
      {trigger(() => inputRef.current?.click())}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </>
  );
}
