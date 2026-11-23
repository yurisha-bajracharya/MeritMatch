"use client";

/**
 * Prepare a file for upload: photos are redrawn to JPEG (max 1600px), which
 * drops EXIF data such as GPS location. PDFs pass through unchanged. The
 * server checks the real type and strips JPEG metadata again.
 */
export async function cleanForUpload(file: File): Promise<Blob> {
  if (file.type === "application/pdf") return file;
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.85));
  } catch {
    return file;
  }
}
