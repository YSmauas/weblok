/**
 * בונה ZIP מתוך מפת קבצים (נתיב → תוכן) ומוריד אותו - הכל בזיכרון הדפדפן, בלי שרת.
 * `folderName` - שם התיקייה בתוך ה-ZIP (יכול להיות בעברית). שם הקובץ עצמו
 * נשאר ASCII: Chrome מחליף שמות הורדה לא-ASCII ב-"download" בחלק מהמערכות.
 */
export async function downloadAsZip(files: Record<string, string>, zipName: string, folderName?: string) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const folder = zip.folder(folderName ?? zipName.replace(/\.zip$/, "")) ?? zip;
  Object.entries(files).forEach(([name, content]) => folder.file(name, content));

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
