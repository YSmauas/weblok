/**
 * קבצי הקוד הקבועים של פרויקט "אישורי הגעה" המיוצא.
 *
 * כלל ברזל: אף ערך שהמשתמש הקליד לא משורשר לקבצים האלה. כל ההגדרות נכתבות
 * ל-config/event.json (דרך JSON.stringify בגנרטור) ונקראות בזמן ריצה דרך
 * lib/config.ts - שמאמת אותן שוב (כי הלקוח יכול לערוך את ה-JSON ידנית).
 *
 * הקבצים כתובים כ-String.raw כדי שלוכסנים (regex, \n) יישארו כמו שהם.
 * בקוד המיוצא אין backticks ואין "${" - כך אין שום אינטרפולציה בטעות.
 */

export const NEXT_CONFIG = String.raw`/** @type {import('next').NextConfig} */

// כותרות אבטחה לכל הדפים. האתר לא טוען שום משאב חיצוני (בלי CDN, בלי פונטים
// חיצוניים, בלי סקריפטים של צד שלישי) ולכן ה-CSP יכול להיות הדוק מאוד.
const csp = [
  "default-src 'self'",
  // Next.js מזריק סקריפט inline קטן לטעינת הדף; ב-next dev נדרש גם eval
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // הפרויקט לא כולל הגדרות ESLint; בדיקת הטיפוסים (TypeScript) עדיין רצה בכל build
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

module.exports = nextConfig;
`;

export const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2020",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: false,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  },
  null,
  2
) + "\n";

export const NEXT_ENV = String.raw`/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.
`;

export const GITIGNORE = String.raw`# תלויות ו-build
node_modules/
.next/
out/
*.tsbuildinfo
next-env.d.ts.bak

# סודות - לעולם לא לגיטהאב
.env
.env.*
!.env.example

# שונות
.DS_Store
.vercel
npm-debug.log*
`;

export const ENV_EXAMPLE = String.raw`# העתיקו לקובץ .env.local לפיתוח מקומי, ובפריסה - הגדירו ב-Vercel:
# Project → Settings → Environment Variables. לעולם לא להעלות ערכים אמיתיים לגיטהאב.

# Supabase → Project Settings → API (או Data API)
SUPABASE_URL=https://YOUR-PROJECT.supabase.co

# המפתח הסודי: Secret key (sb_secret_...) או service_role (בפרויקטים ישנים).
# נשאר בצד השרת בלבד. לעולם לא להוסיף לו קידומת NEXT_PUBLIC_
SUPABASE_SECRET_KEY=

# סיסמת הכניסה לדף הניהול /admin (לפחות 10 תווים, מומלץ 16+)
ADMIN_PASSWORD=

# מחרוזת אקראית לחתימת עוגיית הניהול (לפחות 32 תווים)
# ליצירה: openssl rand -hex 32
ADMIN_SESSION_SECRET=
`;

export const SCHEMA_SQL = String.raw`-- =====================================================================
-- אישורי הגעה - סכמת מסד הנתונים
-- להריץ פעם אחת: Supabase → SQL Editor → New query → להדביק → Run
--
-- מודל האבטחה: RLS מופעל בלי שום policy, והרשאות anon/authenticated נשללות.
-- כלומר אף אחד לא יכול לקרוא/לכתוב ישירות מהדפדפן (גם לא עם המפתח הציבורי).
-- רק השרת של האתר (Vercel), עם המפתח הסודי, ניגש לנתונים.
-- =====================================================================

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 80),
  phone text check (phone is null or char_length(phone) <= 20),
  attending text not null check (attending in ('yes', 'no', 'maybe')),
  guests integer not null default 0 check (guests between 0 and 50),
  note text check (note is null or char_length(note) <= 500)
);

create index if not exists rsvps_created_at_idx on public.rsvps (created_at desc);

alter table public.rsvps enable row level security;
revoke all on table public.rsvps from anon, authenticated;

-- הגבלת קצב (לפי hash של כתובת IP - לא נשמרת כתובת גולמית)
create table if not exists public.rsvp_rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

alter table public.rsvp_rate_limits enable row level security;
revoke all on table public.rsvp_rate_limits from anon, authenticated;

-- true = מותר, false = חרג מהמכסה. SECURITY DEFINER עם search_path קבוע,
-- וההרצה שלה שמורה ל-service_role בלבד (נשללת מ-public/anon/authenticated).
create or replace function public.rsvp_check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_count integer;
begin
  if p_key is null or char_length(p_key) > 200 or p_max < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.rsvp_rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count into v_count;

  -- ניקוי מזדמן של רשומות ישנות
  if random() < 0.02 then
    delete from public.rsvp_rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_max;
end;
$fn$;

revoke all on function public.rsvp_check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rsvp_check_rate_limit(text, integer, integer) to service_role;
`;

export const LIB_DB = String.raw`/**
 * קליינט Supabase לצד השרת בלבד, עם המפתח הסודי (עוקף RLS).
 * לעולם לא לייבא את הקובץ הזה מקומפוננטת "use client".
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
`;

export const LIB_SECURITY = String.raw`/**
 * אבטחה בצד השרת: סשן ניהול חתום (HMAC), השוואת סיסמה בזמן קבוע,
 * הגבלת קצב לפי hash של IP, בדיקת מקור (CSRF) וקריאת גוף בקשה מוגבלת בגודל.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "./db";

export const SESSION_COOKIE = "rsvp_admin";
const SESSION_SECONDS = 8 * 60 * 60;

function sessionSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET ?? "";
  return s.length >= 32 ? s : null;
}

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD ?? "";
  return p.length >= 10 ? p : null;
}

export const adminConfigured = () => !!sessionSecret() && !!adminPassword();

/** השוואה בזמן קבוע (על hash, כדי שגם האורך לא ידלוף) */
export function checkPassword(input: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/** מפתח החתימה נגזר גם מהסיסמה - החלפת ADMIN_PASSWORD מנתקת את כל הסשנים הקיימים */
function signingKey(): Buffer | null {
  const secret = sessionSecret();
  const password = adminPassword();
  if (!secret || !password) return null;
  const pwHash = createHash("sha256").update(password, "utf8").digest("hex");
  return createHmac("sha256", secret).update("rsvp-session-v1:" + pwHash).digest();
}

export function createSession(): { value: string; maxAge: number } | null {
  const key = signingKey();
  if (!key) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = exp + "." + randomBytes(16).toString("base64url");
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return { value: payload + "." + sig, maxAge: SESSION_SECONDS };
}

export function verifySession(value: string | undefined): boolean {
  const key = signingKey();
  if (!key || !value || value.length > 200) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const expected = createHmac("sha256", key).update(parts[0] + "." + parts[1]).digest();
  const given = Buffer.from(parts[2], "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  const exp = Number(parts[0]);
  return Number.isFinite(exp) && exp > Date.now() / 1000;
}

export function sessionCookie(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

/** מזהה גולש להגבלת קצב: HMAC של ה-IP (לא שומרים IP גולמי) */
function ipHash(req: Request): string {
  const ip =
    req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key =
    process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "rsvp";
  return createHmac("sha256", key).update(ip).digest("hex").slice(0, 32);
}

/** "ok" = מותר, "limited" = חרג, "error" = המנגנון לא זמין (נחסם - fail closed) */
export async function rateLimit(
  bucket: string,
  req: Request,
  max: number,
  windowSeconds: number
): Promise<"ok" | "limited" | "error"> {
  try {
    const { data, error } = await db().rpc("rsvp_check_rate_limit", {
      p_key: bucket + ":" + ipHash(req),
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true ? "ok" : "limited";
  } catch (e) {
    console.error("rate limit check failed", e);
    return "error";
  }
}

/** הגנת CSRF: בקשות שמשנות מידע חייבות להגיע מאותו אתר */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** JSON בלבד, עם תקרת גודל (נבדקת גם בכותרת וגם בגוף בפועל) */
export async function readJson(req: Request, maxBytes: number): Promise<Record<string, unknown> | null> {
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return null;
  if (Number(req.headers.get("content-length") ?? "0") > maxBytes) return null;
  let text: string;
  try {
    text = await req.text();
  } catch {
    return null;
  }
  if (Buffer.byteLength(text, "utf8") > maxBytes) return null;
  try {
    const data: unknown = JSON.parse(text);
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
`;

export const LIB_CONFIG = String.raw`/**
 * ההגדרות של האירוע. הקובץ config/event.json נוצר ב-WEblok ואפשר לערוך אותו
 * ידנית - לכן כל ערך מאומת כאן שוב (רשימות סגורות, אורכים, קישורים מותרים).
 */
import raw from "@/config/event.json";

const EVENT_TYPES = ["wedding", "mitzvah", "brit", "birthday", "corporate", "other"] as const;
const THEMES = ["elegant", "modern", "floral", "night", "minimal", "festive"] as const;
const FONTS = ["sans", "serif", "rounded", "classic"] as const;
const PHONE_MODES = ["optional", "required", "hidden"] as const;

export interface EventConfig {
  eventType: (typeof EVENT_TYPES)[number];
  eyebrow: string;
  title: string;
  hosts: string;
  date: string;
  time: string;
  timeZone: string;
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
  background: string;
  overlay: number;
}

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;

function str(v: unknown, max: number, multiline = false): string {
  if (typeof v !== "string") return "";
  const s = v.replace(CONTROL, "");
  return (multiline ? s.replace(/\r\n?/g, "\n") : s.replace(/\s+/g, " ")).trim().slice(0, max);
}

function pick<T extends string>(list: readonly T[], v: unknown, fallback: T): T {
  return typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : fallback;
}

function int(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** קישור https לדומיין מתוך רשימה סגורה בלבד */
function safeUrl(v: unknown, hosts: RegExp): string {
  if (typeof v !== "string" || v.length > 600) return "";
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || u.username || u.password || u.port || !hosts.test(u.hostname)) return "";
    return u.toString();
  } catch {
    return "";
  }
}

function validTimeZone(v: unknown): string {
  if (typeof v !== "string" || v.length > 60) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: v });
    return v;
  } catch {
    return "UTC";
  }
}

function normalize(c: Record<string, unknown>): EventConfig {
  const lang = c.lang === "en" ? "en" : "he";
  return {
    eventType: pick(EVENT_TYPES, c.eventType, "other"),
    eyebrow: str(c.eyebrow, 60),
    title: str(c.title, 120),
    hosts: str(c.hosts, 160),
    date: typeof c.date === "string" && DATE.test(c.date) ? c.date : "",
    time: typeof c.time === "string" && TIME.test(c.time) ? c.time : "",
    timeZone: validTimeZone(c.timeZone),
    details: str(c.details, 1500, true),
    venue: str(c.venue, 120),
    address: str(c.address, 200),
    wazeUrl: safeUrl(c.wazeUrl, /^(www\.|ul\.)?waze\.com$/i),
    mapsUrl: safeUrl(c.mapsUrl, /^((www\.)?google\.[a-z.]{2,8}|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl)$/i),
    rsvpDeadline: typeof c.rsvpDeadline === "string" && DATE.test(c.rsvpDeadline) ? c.rsvpDeadline : "",
    maxGuests: int(c.maxGuests, 1, 20, 6),
    phoneMode: pick(PHONE_MODES, c.phoneMode, "optional"),
    thanks: str(c.thanks, 200),
    lang,
    dir: c.dir === "ltr" || c.dir === "rtl" ? c.dir : lang === "he" ? "rtl" : "ltr",
    theme: pick(THEMES, c.theme, "elegant"),
    accent: typeof c.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(c.accent) ? c.accent : "#b08d57",
    font: pick(FONTS, c.font, "sans"),
    background: typeof c.background === "string" && /^\/bg\.(jpg|png|webp)$/.test(c.background) ? c.background : "",
    overlay: int(c.overlay, 0, 90, 45),
  };
}

export const config: EventConfig = normalize(raw as Record<string, unknown>);

/** התאריך של "היום" באזור הזמן של האירוע, בפורמט YYYY-MM-DD */
export function todayInEventZone(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** אפשר עדיין לאשר הגעה? (עד סוף יום ה-deadline, כולל) */
export function rsvpOpen(): boolean {
  return !config.rsvpDeadline || todayInEventZone() <= config.rsvpDeadline;
}
`;

export const LIB_THEME = String.raw`import type { CSSProperties } from "react";
import type { EventConfig } from "./config";

/** גופני מערכת בלבד - בלי טעינה משרת חיצוני */
const FONT_STACKS: Record<EventConfig["font"], string> = FONT_STACKS_JSON;

/** טקסט קריא על צבע המבטא (שחור או לבן לפי בהירות) */
function onAccent(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#15120e" : "#ffffff";
}

/** משתני CSS מההגדרות (שכבר אומתו ב-lib/config.ts) */
export function themeStyle(cfg: EventConfig): CSSProperties {
  const vars: Record<string, string> = {
    "--accent": cfg.accent,
    "--on-accent": onAccent(cfg.accent),
    "--font": FONT_STACKS[cfg.font],
    "--overlay": String(cfg.overlay / 100),
  };
  if (cfg.background) vars["--bg-image"] = "url(" + cfg.background + ")";
  return vars as CSSProperties;
}
`;

export const LIB_STRINGS_TAIL = String.raw`
export type Strings = (typeof ALL)["he"];

export const S: Strings = ALL[config.lang] as Strings;

/** "יום חמישי, 17 בדצמבר 2026" - צהריים UTC, כדי שהיום לא "יזוז" בגלל אזור זמן */
export function formatDate(date: string): string {
  if (!date) return "";
  const d = new Date(date + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(config.lang === "he" ? "he-IL" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export const fill = (text: string, vars: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
`;

export const APP_LAYOUT = String.raw`import type { Metadata, Viewport } from "next";
import "./globals.css";
import { config } from "@/lib/config";
import { themeStyle } from "@/lib/theme";

export const metadata: Metadata = {
  title: config.title,
  description: config.hosts || config.title,
  // הזמנה פרטית - לא לאינדקס במנועי חיפוש
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={config.lang} dir={config.dir} data-theme={config.theme} style={themeStyle(config)}>
      <body>
        {config.background ? <div className="bg" aria-hidden="true" /> : null}
        {children}
      </body>
    </html>
  );
}
`;

export const APP_ROBOTS = String.raw`import type { MetadataRoute } from "next";

// הזמנה פרטית: חוסמים סריקה של כל האתר
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
`;

export const APP_PAGE = String.raw`import { config, rsvpOpen } from "@/lib/config";
import { S, fill, formatDate } from "@/lib/strings";
import RsvpForm from "./RsvpForm";

// הדף נבנה מחדש כל שעה - כדי שסגירת האישורים אחרי ה-deadline תתעדכן לבד
export const revalidate = 3600;

export default function InvitationPage() {
  const open = rsvpOpen();
  const eyebrow = config.eyebrow || S.type[config.eventType];
  const hasPlace = !!(config.venue || config.address);

  return (
    <main className="page">
      <article className="card hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="title">{config.title}</h1>
        {config.hosts ? <p className="hosts">{config.hosts}</p> : null}
        <hr className="divider" />

        {config.date || config.time ? (
          <dl className="when">
            {config.date ? (
              <div>
                <dt>{S.date}</dt>
                <dd>{formatDate(config.date)}</dd>
              </div>
            ) : null}
            {config.time ? (
              <div>
                <dt>{S.time}</dt>
                <dd dir="ltr">{config.time}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {config.details ? <p className="details">{config.details}</p> : null}

        {hasPlace ? (
          <div className="place">
            {config.venue ? <strong>{config.venue}</strong> : null}
            {config.address ? <span>{config.address}</span> : null}
          </div>
        ) : null}

        <div className="links">
          {config.wazeUrl ? (
            <a className="btn ghost" href={config.wazeUrl} target="_blank" rel="noopener noreferrer">
              {S.waze}
            </a>
          ) : null}
          {config.mapsUrl ? (
            <a className="btn ghost" href={config.mapsUrl} target="_blank" rel="noopener noreferrer">
              {S.maps}
            </a>
          ) : null}
          {config.date ? (
            <a className="btn ghost" href="/event.ics" download="event.ics">
              {S.calendar}
            </a>
          ) : null}
        </div>
      </article>

      <section className="card" aria-labelledby="rsvp-title">
        <h2 id="rsvp-title">{S.rsvpTitle}</h2>
        {open ? (
          <>
            {config.rsvpDeadline ? (
              <p className="muted">{fill(S.rsvpUntil, { date: formatDate(config.rsvpDeadline) })}</p>
            ) : null}
            <RsvpForm />
          </>
        ) : (
          <p className="muted">{S.rsvpClosed}</p>
        )}
      </section>
    </main>
  );
}
`;

export const APP_RSVP_FORM = String.raw`"use client";

import { useState, type FormEvent } from "react";
import { config } from "@/lib/config";
import { S } from "@/lib/strings";

type Attending = "yes" | "no" | "maybe";
type Status = { kind: "idle" | "sending" | "done" } | { kind: "error"; text: string; fields?: string[] };

export default function RsvpForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [attending, setAttending] = useState<Attending>("yes");
  const [guests, setGuests] = useState(1);
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState(""); // מלכודת בוטים - שדה נסתר
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const bad = (field: string) => status.kind === "error" && !!status.fields?.includes(field);
  const showPhone = config.phoneMode !== "hidden";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (status.kind === "sending") return;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: showPhone ? phone : "",
          attending,
          guests: attending === "no" ? 0 : guests,
          note,
          website,
        }),
      });
      if (res.ok) {
        setStatus({ kind: "done" });
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: string[] };
      if (res.status === 400) setStatus({ kind: "error", text: S.errInvalid, fields: data.fields });
      else if (res.status === 429) setStatus({ kind: "error", text: S.errRate });
      else if (data.error === "closed") setStatus({ kind: "error", text: S.errClosed });
      else setStatus({ kind: "error", text: S.errServer });
    } catch {
      setStatus({ kind: "error", text: S.errServer });
    }
  }

  if (status.kind === "done") {
    return (
      <div className="done" role="status">
        <p className="status">{config.thanks || S.thanks}</p>
        <button
          type="button"
          className="btn ghost"
          style={{ marginTop: 14 }}
          onClick={() => {
            setName("");
            setPhone("");
            setNote("");
            setGuests(1);
            setAttending("yes");
            setStatus({ kind: "idle" });
          }}
        >
          {S.again}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div>
        <label htmlFor="rsvp-name">{S.name}</label>
        <input
          id="rsvp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoComplete="name"
          required
          aria-invalid={bad("name")}
        />
      </div>

      {showPhone ? (
        <div>
          <label htmlFor="rsvp-phone">
            {S.phone} {config.phoneMode === "optional" ? <span className="muted">{S.optional}</span> : null}
          </label>
          <input
            id="rsvp-phone"
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
            autoComplete="tel"
            inputMode="tel"
            required={config.phoneMode === "required"}
            aria-invalid={bad("phone")}
          />
        </div>
      ) : null}

      <fieldset aria-invalid={bad("attending")}>
        <legend>{S.attending}</legend>
        <div className="choices">
          {(["yes", "maybe", "no"] as const).map((v) => (
            <label key={v} className="choice">
              <input type="radio" name="attending" value={v} checked={attending === v} onChange={() => setAttending(v)} />
              <span>{S[v]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {attending !== "no" ? (
        <div>
          <label htmlFor="rsvp-guests">{S.guests}</label>
          <select
            id="rsvp-guests"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            aria-invalid={bad("guests")}
          >
            {Array.from({ length: config.maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label htmlFor="rsvp-note">{S.note}</label>
        <textarea id="rsvp-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} aria-invalid={bad("note")} />
      </div>

      <div className="hp" aria-hidden="true">
        <label htmlFor="rsvp-website">Website</label>
        <input id="rsvp-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <button type="submit" className="btn block" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? S.sending : S.submit}
      </button>
      {status.kind === "error" ? (
        <p className="status error" role="alert">
          {status.text}
        </p>
      ) : null}
    </form>
  );
}
`;

export const API_RSVP = String.raw`import { NextResponse } from "next/server";
import { config, rsvpOpen } from "@/lib/config";
import { db } from "@/lib/db";
import { rateLimit, readJson, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;
const PHONE = /^\+?[0-9][0-9\s()-]{5,19}$/;

function text(v: unknown, multiline = false): string {
  if (typeof v !== "string") return "";
  const s = v.replace(CONTROL, "");
  return (multiline ? s.replace(/\r\n?/g, "\n") : s.replace(/\s+/g, " ")).trim();
}

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

/** קבלת אישור הגעה. POST בלבד (שאר המתודות מחזירות 405 אוטומטית). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);

  const body = await readJson(req, 4096);
  if (!body) return json({ error: "invalid", fields: [] }, 400);

  // מלכודת בוטים: אדם לא רואה את השדה הזה. מחזירים "הצלחה" בלי לשמור כלום.
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });

  if (!rsvpOpen()) return json({ error: "closed" }, 403);

  const name = text(body.name);
  const phone = config.phoneMode === "hidden" ? "" : text(body.phone);
  const attending = body.attending;
  const note = text(body.note, true);
  const guestsRaw = typeof body.guests === "number" ? body.guests : Number.NaN;

  const fields: string[] = [];
  if (name.length < 2 || name.length > 80) fields.push("name");
  if (phone ? !PHONE.test(phone) : config.phoneMode === "required") fields.push("phone");
  if (attending !== "yes" && attending !== "no" && attending !== "maybe") fields.push("attending");
  const guests = attending === "no" ? 0 : guestsRaw;
  if (attending !== "no" && (!Number.isInteger(guests) || guests < 1 || guests > config.maxGuests)) fields.push("guests");
  if (note.length > 500) fields.push("note");
  if (fields.length) return json({ error: "invalid", fields }, 400);

  const limit = await rateLimit("rsvp", req, 8, 10 * 60);
  if (limit === "limited") return json({ error: "rate_limited" }, 429);
  if (limit === "error") return json({ error: "server" }, 503);

  const { error } = await db()
    .from("rsvps")
    .insert({ name, phone: phone || null, attending, guests, note: note || null });
  if (error) {
    console.error("rsvp insert failed", error.message);
    return json({ error: "server" }, 500);
  }
  return json({ ok: true });
}
`;

export const API_LOGIN = String.raw`import { NextResponse } from "next/server";
import { SESSION_COOKIE, adminConfigured, checkPassword, createSession, rateLimit, readJson, sameOrigin, sessionCookie } from "@/lib/security";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  if (!adminConfigured()) return json({ error: "not_configured" }, 503);

  // 5 ניסיונות לכל 15 דקות לכל IP - חוסם ניחוש סיסמה בכוח גס
  const limit = await rateLimit("login", req, 5, 15 * 60);
  if (limit === "limited") return json({ error: "rate_limited" }, 429);
  if (limit === "error") return json({ error: "server" }, 503);

  const body = await readJson(req, 1024);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || password.length > 200 || !checkPassword(password)) return json({ error: "wrong" }, 401);

  const session = createSession();
  if (!session) return json({ error: "not_configured" }, 503);
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, session.value, sessionCookie(session.maxAge));
  return res;
}
`;

export const API_LOGOUT = String.raw`import { NextResponse } from "next/server";
import { SESSION_COOKIE, sameOrigin, sessionCookie } from "@/lib/security";

export const dynamic = "force-dynamic";

/** יציאה: טופס POST רגיל מדף הניהול, מוחק את העוגייה וחוזר ל-/admin */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  res.cookies.set(SESSION_COOKIE, "", sessionCookie(0));
  return res;
}
`;

export const API_DELETE = String.raw`import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, readJson, sameOrigin, verifySession } from "@/lib/security";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!verifySession((await cookies()).get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await readJson(req, 512);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!UUID.test(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { error } = await db().from("rsvps").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
`;

export const API_EXPORT = String.raw`import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/security";

export const dynamic = "force-dynamic";

/** תא CSV בטוח: מרכאות כפולות, ומניעת "הזרקת נוסחאות" לאקסל (=, +, -, @) */
function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

export async function GET() {
  if (!verifySession((await cookies()).get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await db()
    .from("rsvps")
    .select("created_at, name, phone, attending, guests, note")
    .order("created_at", { ascending: true })
    .limit(10000);
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });

  const header = ["created_at", "name", "phone", "attending", "guests", "note"];
  const lines = [header.join(",")].concat(
    (data ?? []).map((r) => header.map((h) => cell((r as Record<string, unknown>)[h])).join(","))
  );
  // BOM - כדי שאקסל יפתח עברית נכון
  const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rsvps.csv"',
      "Cache-Control": "no-store",
    },
  });
}
`;

export const APP_ICS = String.raw`import { config } from "@/lib/config";

/** קובץ יומן (iCalendar) לאירוע - "הוספה ליומן" בלחיצה אחת */
export const dynamic = "force-static";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** קיפול שורות ל-75 בתים לכל היותר, כנדרש בתקן */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch, "utf8");
    if (bytes + b > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function GET() {
  if (!config.date) return new Response("Not found", { status: 404 });
  const day = config.date.replace(/-/g, "");
  const start = config.time
    ? "DTSTART;TZID=" + config.timeZone + ":" + day + "T" + config.time.replace(":", "") + "00"
    : "DTSTART;VALUE=DATE:" + day;
  const stamp = new Date().toISOString().replace(/-|:/g, "").replace(/\.\d{3}/, "");
  const location = [config.venue, config.address].filter(Boolean).join(", ");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RSVP//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:" + day + "-rsvp-event",
    "DTSTAMP:" + stamp,
    start,
    config.time ? "DURATION:PT4H" : "DURATION:P1D",
    "SUMMARY:" + esc(config.title),
    location ? "LOCATION:" + esc(location) : "",
    config.details ? "DESCRIPTION:" + esc(config.details) : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="event.ics"',
    },
  });
}
`;

export const APP_ADMIN_PAGE = String.raw`import type { Metadata } from "next";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { S } from "@/lib/strings";
import { SESSION_COOKIE, adminConfigured, verifySession } from "@/lib/security";
import LoginForm from "./LoginForm";
import AdminTable, { type Row } from "./AdminTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: S.admin.title,
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <main className="page">
        <section className="card">
          <h1>{S.admin.title}</h1>
          <p className="status error">{S.admin.notConfigured}</p>
        </section>
      </main>
    );
  }

  if (!verifySession((await cookies()).get(SESSION_COOKIE)?.value)) {
    return (
      <main className="page">
        <section className="card">
          <h1>{S.admin.title}</h1>
          <LoginForm />
        </section>
      </main>
    );
  }

  let rows: Row[] = [];
  let failed = false;
  try {
    const { data, error } = await db()
      .from("rsvps")
      .select("id, created_at, name, phone, attending, guests, note")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    rows = (data ?? []) as Row[];
  } catch (e) {
    console.error("admin load failed", e);
    failed = true;
  }

  return (
    <main className="page wide">
      <header className="admin-head">
        <h1>{S.admin.title}</h1>
        <div className="links">
          <a className="btn ghost" href="/">
            {S.admin.viewSite}
          </a>
          <a className="btn ghost" href="/api/admin/export">
            {S.admin.exportCsv}
          </a>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="btn ghost">
              {S.admin.logout}
            </button>
          </form>
        </div>
      </header>
      {failed ? <p className="status error">{S.admin.dbError}</p> : <AdminTable initialRows={rows} />}
    </main>
  );
}
`;

export const APP_ADMIN_LOGIN = String.raw`"use client";

import { useState, type FormEvent } from "react";
import { S } from "@/lib/strings";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        res.status === 429
          ? S.admin.tooMany
          : data.error === "wrong"
            ? S.admin.wrong
            : data.error === "not_configured"
              ? S.admin.notConfigured
              : S.errServer
      );
    } catch {
      setError(S.errServer);
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  return (
    <form onSubmit={submit}>
      <div>
        <label htmlFor="admin-password">{S.admin.password}</label>
        <input
          id="admin-password"
          type="password"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          maxLength={200}
          required
        />
      </div>
      <button type="submit" className="btn block" disabled={busy}>
        {busy ? S.sending : S.admin.login}
      </button>
      {error ? (
        <p className="status error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
`;

export const APP_ADMIN_TABLE = String.raw`"use client";

import { useMemo, useState } from "react";
import { S, fill } from "@/lib/strings";
import { config } from "@/lib/config";

export interface Row {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  attending: "yes" | "no" | "maybe";
  guests: number;
  note: string | null;
}

type Filter = "all" | Row["attending"];

export default function AdminTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    const t = { all: rows.length, yes: 0, maybe: 0, no: 0, guests: 0 };
    for (const r of rows) {
      t[r.attending] += 1;
      if (r.attending === "yes") t.guests += r.guests;
    }
    return t;
  }, [rows]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "all" || r.attending === filter) &&
        (!q || r.name.toLowerCase().includes(q) || (r.phone ?? "").includes(q))
    );
  }, [rows, filter, query]);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(config.lang === "he" ? "he-IL" : "en-US", {
        day: "numeric",
        month: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  async function remove(row: Row) {
    if (!window.confirm(fill(S.admin.confirmDelete, { name: row.name }))) return;
    setError("");
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error();
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch {
      setError(S.admin.deleteFailed);
    }
  }

  const label: Record<Row["attending"], string> = { yes: S.admin.coming, maybe: S.admin.maybe, no: S.admin.notComing };
  const filters: { id: Filter; text: string; n: number }[] = [
    { id: "all", text: S.admin.filterAll, n: totals.all },
    { id: "yes", text: S.admin.coming, n: totals.yes },
    { id: "maybe", text: S.admin.maybe, n: totals.maybe },
    { id: "no", text: S.admin.notComing, n: totals.no },
  ];

  return (
    <>
      <div className="stats">
        <div className="card stat">
          <span>{S.admin.responses}</span>
          <strong>{totals.all}</strong>
        </div>
        <div className="card stat">
          <span>{S.admin.coming}</span>
          <strong>{totals.yes}</strong>
        </div>
        <div className="card stat">
          <span>{S.admin.guests}</span>
          <strong>{totals.guests}</strong>
        </div>
        <div className="card stat">
          <span>{S.admin.maybe}</span>
          <strong>{totals.maybe}</strong>
        </div>
      </div>

      <section className="card">
        <div className="toolbar">
          <div className="tabs" role="tablist">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                className={filter === f.id ? "tab on" : "tab"}
                onClick={() => setFilter(f.id)}
              >
                {f.text} ({f.n})
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={S.admin.search}
            aria-label={S.admin.search}
            className="search"
          />
        </div>

        {error ? (
          <p className="status error" role="alert">
            {error}
          </p>
        ) : null}

        {shown.length === 0 ? (
          <p className="muted">{S.admin.empty}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{S.admin.colName}</th>
                  <th>{S.admin.colStatus}</th>
                  <th>{S.admin.colGuests}</th>
                  <th>{S.admin.colPhone}</th>
                  <th>{S.admin.colNote}</th>
                  <th>{S.admin.colDate}</th>
                  <th aria-label={S.admin.delete} />
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>
                      <span className={"pill " + r.attending}>{label[r.attending]}</span>
                    </td>
                    <td>{r.attending === "no" ? "-" : r.guests}</td>
                    <td dir="ltr">{r.phone ?? ""}</td>
                    <td className="note">{r.note ?? ""}</td>
                    <td>{dateFmt.format(new Date(r.created_at))}</td>
                    <td>
                      <button type="button" className="link-btn" onClick={() => remove(r)}>
                        {S.admin.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
`;

/** תוספת CSS לדף הניהול (נכנסת ל-globals.css של הפרויקט המיוצא בלבד) */
export const ADMIN_CSS = String.raw`
/* --- דף ניהול --- */
.page.wide { max-width: 1100px; }
.admin-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.admin-head h1 { margin: 0; font-size: 1.5rem; }
.admin-head .links { margin: 0; }
.admin-head form { display: contents; margin: 0; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.stat { padding: 16px; display: grid; gap: 2px; }
.stat span { color: var(--muted); font-size: 0.8rem; }
.stat strong { font-size: 1.8rem; line-height: 1.1; }
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.tab { font: inherit; font-size: 0.85rem; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line); background: transparent; color: var(--text); cursor: pointer; min-height: 36px; }
.tab.on { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
.search { max-width: 260px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th, td { text-align: start; padding: 10px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--muted); font-weight: 600; font-size: 0.8rem; white-space: nowrap; }
td.note { max-width: 260px; white-space: pre-line; overflow-wrap: anywhere; }
.pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; border: 1px solid var(--line); white-space: nowrap; }
.pill.yes { border-color: var(--accent); }
.pill.no { opacity: 0.7; }
.link-btn { font: inherit; font-size: 0.85rem; background: none; border: 0; color: #d14b3a; cursor: pointer; padding: 4px; }
`;
