import type { StructureImage, StructureValues } from "../types";
import { EVENT_TYPES, FONTS, LINK_MODES, PHONE_MODES, THEMES, TIME_ZONES, fields } from "./fields";

/**
 * ההגדרות אחרי סניטציה - זה בדיוק מה שנכתב ל-config/event.json בפרויקט
 * המיוצא (דרך JSON.stringify, לעולם לא שרשור לתוך קוד) ומה שהתצוגה המקדימה
 * מציגה. כל ערך כאן כבר עבר ולידציה: רשימות סגורות, אורך מקסימלי, קישורים
 * מדומיינים מותרים בלבד.
 */
export interface EventConfig {
  eventType: (typeof EVENT_TYPES)[number];
  eyebrow: string;
  title: string;
  hosts: string;
  date: string;
  time: string;
  timeZone: (typeof TIME_ZONES)[number];
  details: string;
  venue: string;
  address: string;
  wazeUrl: string;
  mapsUrl: string;
  rsvpDeadline: string;
  maxGuests: number;
  phoneMode: (typeof PHONE_MODES)[number];
  thanks: string;
  lang: "he" | "en";
  dir: "rtl" | "ltr";
  theme: (typeof THEMES)[number];
  accent: string;
  font: (typeof FONTS)[number];
  /** נתיב יחסי בתוך public/ או מחרוזת ריקה */
  background: string;
  overlay: number;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// תווי בקרה (חוץ משורה חדשה/טאב) ותווי כיווניות מסוכנים (bidi override) - נזרקים
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g;

const maxLen = (id: string) => fields.find((f) => f.id === id)?.maxLength ?? 200;

function text(values: StructureValues, id: string, multiline = false): string {
  let s = String(values[id] ?? "").replace(CONTROL, "");
  s = multiline ? s.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n") : s.replace(/\s+/g, " ");
  return s.trim().slice(0, maxLen(id));
}

function pick<T extends string>(list: readonly T[], v: string | undefined, fallback: T): T {
  return (list as readonly string[]).includes(v ?? "") ? (v as T) : fallback;
}

function num(v: string | undefined, min: number, max: number, fallback: number): number {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** קישור ל-Waze: רק https://waze.com/... או https://www.waze.com/... (כולל ul.waze.com) */
export function safeWaze(v: string): string {
  const s = v.trim();
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return "";
    if (!/^(www\.|ul\.)?waze\.com$/i.test(u.hostname)) return "";
    return u.toString();
  } catch {
    return "";
  }
}

/** קישור לגוגל מפות: google.com/maps, maps.google.com, maps.app.goo.gl, goo.gl/maps */
export function safeMaps(v: string): string {
  const s = v.trim();
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return "";
    const host = u.hostname.toLowerCase();
    const ok =
      ((host === "google.com" || host === "www.google.com" || /^(www\.)?google\.co(m)?\.[a-z]{2}$/.test(host)) &&
        u.pathname.startsWith("/maps")) ||
      host === "maps.google.com" ||
      host === "maps.app.goo.gl" ||
      (host === "goo.gl" && u.pathname.startsWith("/maps"));
    return ok ? u.toString() : "";
  } catch {
    return "";
  }
}

export const wazeFromAddress = (address: string) =>
  address ? `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes` : "";
export const mapsFromAddress = (address: string) =>
  address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "";

export function sanitizeConfig(values: StructureValues, image: StructureImage | null): EventConfig {
  const lang = values.lang === "en" ? "en" : "he";
  const dirChoice = values.dir;
  const dir = dirChoice === "rtl" || dirChoice === "ltr" ? dirChoice : lang === "he" ? "rtl" : "ltr";
  const address = text(values, "address");
  const venue = text(values, "venue");
  const place = [venue, address].filter(Boolean).join(", ");

  const wazeMode = pick(LINK_MODES, values.wazeMode, "auto");
  const mapsMode = pick(LINK_MODES, values.mapsMode, "auto");

  return {
    eventType: pick(EVENT_TYPES, values.eventType, "wedding"),
    eyebrow: text(values, "eyebrow"),
    title: text(values, "title") || (lang === "he" ? "הזמנה לאירוע" : "You're invited"),
    hosts: text(values, "hosts"),
    date: DATE.test(values.date ?? "") ? values.date : "",
    time: TIME.test(values.time ?? "") ? values.time : "",
    timeZone: pick(TIME_ZONES, values.timeZone, "Asia/Jerusalem"),
    details: text(values, "details", true),
    venue,
    address,
    wazeUrl: wazeMode === "custom" ? safeWaze(values.wazeUrl ?? "") : wazeMode === "auto" ? wazeFromAddress(address || venue) : "",
    mapsUrl: mapsMode === "custom" ? safeMaps(values.mapsUrl ?? "") : mapsMode === "auto" ? mapsFromAddress(place) : "",
    rsvpDeadline: DATE.test(values.rsvpDeadline ?? "") ? values.rsvpDeadline : "",
    maxGuests: num(values.maxGuests, 1, 20, 6),
    phoneMode: pick(PHONE_MODES, values.phoneMode, "optional"),
    thanks: text(values, "thanks"),
    lang,
    dir,
    theme: pick(THEMES, values.theme, "elegant"),
    accent: HEX.test(values.accent ?? "") ? values.accent.toLowerCase() : "#b08d57",
    font: pick(FONTS, values.font, "serif"),
    background: image ? `/bg.${image.ext}` : "",
    overlay: num(values.overlay, 0, 90, 45),
  };
}

/** שם ריפו מוצע (ASCII בלבד) */
export function suggestRepoName(cfg: EventConfig): string {
  const base = cfg.date ? `rsvp-${cfg.date}` : "event-rsvp";
  return base.replace(/[^A-Za-z0-9._-]/g, "-");
}
