import type { ImageKind, Word } from "./types";

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Downloads the real image when there is one, otherwise renders the emoji placeholder to a PNG. */
export async function downloadWordImage(word: Word, kind?: ImageKind): Promise<void> {
  const img = (kind && word.images.find((i) => i.kind === kind)) || word.images.find((i) => i.url) || word.images[0];
  const name = `${word.plain_text}.png`;
  if (img?.url) {
    const res = await fetch(img.url);
    if (!res.ok) throw new Error("download failed");
    const blob = await res.blob();
    save(blob, `${word.plain_text}.${blob.type.split("/")[1] || "png"}`);
    return;
  }
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  if ((kind ?? img?.kind) === "bw") ctx.filter = "grayscale(1)";
  ctx.font = `${size * 0.7}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(word.emoji ?? "🖼️", size / 2, size / 2 + size * 0.04);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("render failed");
  save(blob, name);
}

/** Resizes an image file to max 1024px and re-encodes as JPEG (keeps uploads small + strips EXIF). */
export async function prepareImage(file: File, maxSide = 1024): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error("encode failed");
  return blob;
}
