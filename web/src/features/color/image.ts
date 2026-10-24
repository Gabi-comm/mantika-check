// image loading for the analyzer
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Please choose a JPEG or PNG image.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Image is larger than 10MB. Please choose a smaller file.";
  }
  return null;
}

export function cameraErrorMessage(error: unknown): string {
  const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera permission was denied. Allow camera access in your browser settings, or upload a photo instead.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No usable camera was found. You can upload a photo instead.";
  if (name === "NotReadableError" || name === "AbortError") return "The camera is unavailable or already in use by another app. Close it there and try again.";
  return "The camera could not be started. Check browser camera permissions, or upload a photo instead.";
}

export function rotatedCanvas(img: HTMLImageElement, rotationDeg: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const swap = rotationDeg === 90 || rotationDeg === 270;
  canvas.width = swap ? img.naturalHeight : img.naturalWidth;
  canvas.height = swap ? img.naturalWidth : img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvas;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
