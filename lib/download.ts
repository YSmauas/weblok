/** הורדת קובץ טקסט שנוצר בדפדפן - בלי שרת. */
export function downloadText(fileName: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Safari מבטל הורדה אם ה-URL משוחרר באותו tick
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** העתקה ללוח. מחזיר false אם הדפדפן חסם (אז המשתמש יכול לסמן ולהעתיק ידנית). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
