import type { StructureImage } from "./types";

/** תמונת רקע: עד 1.5MB, JPG/PNG/WEBP בלבד - נבדק לפי ה-magic bytes ולא לפי הסיומת/ה-MIME שהדפדפן מדווח. */
export const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

export type ImageError = "too_big" | "bad_type" | "read_failed";

function sniff(b: Uint8Array): Pick<StructureImage, "ext" | "mime"> | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length >= 8 && png.every((v, i) => b[i] === v)) return { ext: "png", mime: "image/png" };
  const ascii = (from: number, to: number) => String.fromCharCode(...Array.from(b.subarray(from, to)));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(bin);
}

export function utf8ToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

export async function readImage(file: File): Promise<{ ok: true; image: StructureImage } | { ok: false; error: ImageError }> {
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "too_big" };
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return { ok: false, error: "read_failed" };
  }
  if (bytes.length > MAX_IMAGE_BYTES) return { ok: false, error: "too_big" };
  const type = sniff(bytes);
  if (!type) return { ok: false, error: "bad_type" };
  return { ok: true, image: { ...type, base64: bytesToBase64(bytes), size: bytes.length } };
}

/** ולידציה חוזרת לפני שימוש (למשל בתצוגה המקדימה) - base64 תקני בלבד. */
export const isSafeBase64 = (s: string) => /^[A-Za-z0-9+/]+={0,2}$/.test(s);
