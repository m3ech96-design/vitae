export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

/**
 * Ritaglia l'immagine nell'area scelta e la disegna su un canvas. Prima l'output era sempre
 * un quadrato fisso (`outputSize x outputSize`): qualunque area di ritaglio, anche
 * rettangolare, veniva schiacciata o stirata dentro quel quadrato, tagliando parte
 * dell'immagine invece di rispettarne il rapporto scelto. Ora il canvas eredita le
 * dimensioni reali dell'area ritagliata (`crop.width` x `crop.height`, scalate per restare
 * entro `maxOutputSize` sul lato più lungo) — un ritaglio verticale produce un'immagine
 * verticale, uno orizzontale un'immagine orizzontale, nessuna deformazione.
 */
export async function getCroppedImage(
  imageSrc: string,
  crop: PixelCrop,
  maxOutputSize = 1024
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, maxOutputSize / Math.max(crop.width, crop.height));
  const outputWidth = Math.round(crop.width * scale);
  const outputHeight = Math.round(crop.height * scale);
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossibile creare il contesto canvas");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return canvas.toDataURL("image/png", 0.92);
}
