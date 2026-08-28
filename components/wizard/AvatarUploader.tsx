"use client";
import { Camera } from "lucide-react";
import { AuraAvatar } from "../ui/AuraAvatar";
import { ImageCropInput } from "../ui/ImageCropInput";

export function AvatarUploader({
  imageUrl,
  firstName,
  lastName,
  onChange,
}: {
  imageUrl?: string;
  firstName?: string;
  lastName?: string;
  onChange: (key: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <AuraAvatar imageUrl={imageUrl} firstName={firstName} lastName={lastName} size={128} ring="idle" />
        <ImageCropInput
          shape="round"
          onChange={onChange}
          trigger={(open) => (
            <button
              type="button"
              onClick={open}
              className="focus-ring absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-aura-gradient text-void-950 shadow-glow-sm transition-transform active:scale-90"
              aria-label="Carica Immagine Profilo"
            >
              <Camera size={16} strokeWidth={2.4} />
            </button>
          )}
        />
      </div>
      <p className="text-center text-xs text-ink-800">
        Immagine Di Profilo Facoltativa &middot; Puoi Ridimensionarla Per Centrare Il Soggetto
      </p>
    </div>
  );
}
