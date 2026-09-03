const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.84;
const MAX_OUTPUT_BYTES = 4.5 * 1024 * 1024;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function compressProductImage(file: File): Promise<File> {
  if (!file.size) throw new Error("La imagen está vacía");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Formato no permitido. Usa JPG, PNG o WebP");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("La imagen supera el máximo de 15 MB antes de optimizar");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("No fue posible procesar la imagen");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  let quality = WEBP_QUALITY;
  let blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("No fue posible comprimir la imagen")), "image/webp", quality));
  while (blob.size > MAX_OUTPUT_BYTES && quality > 0.5) {
    quality -= 0.08;
    blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("No fue posible comprimir la imagen")), "image/webp", quality));
  }
  if (blob.size > MAX_OUTPUT_BYTES) throw new Error("La imagen no pudo reducirse bajo 4,5 MB. Selecciona una imagen más pequeña.");
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-");
  return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
}
