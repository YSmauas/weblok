/** בונה ZIP מתוך פלט exportBlock ומוריד אותו - הכל בזיכרון הדפדפן, בלי שרת. */
export async function downloadAsZip(files: Record<string, string>, zipName: string) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const folder = zip.folder(zipName.replace(/\.zip$/, "")) ?? zip;
  Object.entries(files).forEach(([name, content]) => folder.file(name, content));

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
