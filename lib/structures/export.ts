import type { GeneratedProject } from "./types";
import type { PushEntry } from "@/lib/github/manager";
import { utf8ToBase64 } from "./image";

/** ZIP של הפרויקט (כולל קבצים בינאריים) - נבנה ומורד בדפדפן בלבד, בלי שרת. */
export async function downloadProjectZip(files: GeneratedProject, zipName: string, folderName: string) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const folder = zip.folder(folderName) ?? zip;
  for (const [path, content] of Object.entries(files)) {
    if (typeof content === "string") folder.file(path, content);
    else folder.file(path, content.base64, { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** המרה לפורמט של pushEntries (הכל base64 - עובד גם לתמונה) */
export function toPushEntries(files: GeneratedProject): PushEntry[] {
  return Object.entries(files).map(([path, content]) => ({
    path,
    base64: typeof content === "string" ? utf8ToBase64(content) : content.base64,
  }));
}

/** גודל משוער בבתים (להצגה) */
export function projectSize(files: GeneratedProject): number {
  const enc = new TextEncoder();
  let n = 0;
  for (const c of Object.values(files)) n += typeof c === "string" ? enc.encode(c).length : Math.floor((c.base64.length * 3) / 4);
  return n;
}
