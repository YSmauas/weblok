import type { GeneratedProject, StructureImage, StructureValues } from "../types";
import { isSafeBase64 } from "../image";
import { sanitizeConfig, type EventConfig } from "./config";
import { SITE_STRINGS } from "./strings";
import { FONT_STACKS, THEME_CSS } from "./theme";
import { readme } from "./readme";
import * as T from "./templates";

/** גרסאות קבועות (לא ^) - build צפוי ושחזורי אצל הלקוח */
const PACKAGE_JSON = {
  name: "event-rsvp",
  version: "1.0.0",
  private: true,
  scripts: {
    dev: "next dev",
    build: "next build",
    start: "next start",
  },
  engines: { node: ">=18.18" },
  dependencies: {
    next: "14.2.35",
    react: "18.3.1",
    "react-dom": "18.3.1",
    "@supabase/supabase-js": "2.117.2",
  },
  devDependencies: {
    typescript: "5.5.4",
    "@types/node": "20.14.15",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
  },
};

/** JSON שבטוח גם אם מישהו ידביק אותו בתוך <script> (לא נדרש כאן, אבל זול) */
const safeJson = (v: unknown) =>
  JSON.stringify(v, null, 2).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

function stringsFile(): string {
  return (
    `/** טקסטי הממשק (עברית/אנגלית). השפה נבחרת לפי lang ב-config/event.json */\n` +
    `import { config } from "./config";\n\n` +
    `const ALL = ${safeJson(SITE_STRINGS)};\n` +
    T.LIB_STRINGS_TAIL
  );
}

function themeFile(): string {
  return T.LIB_THEME.replace("FONT_STACKS_JSON", () => safeJson(FONT_STACKS));
}

/** מה שנשמר ב-config/event.json - בדיוק ההגדרות אחרי סניטציה */
export function configJson(cfg: EventConfig): string {
  return safeJson(cfg) + "\n";
}

export function generate(values: StructureValues, image: StructureImage | null): GeneratedProject {
  const img = image && isSafeBase64(image.base64) ? image : null;
  const cfg = sanitizeConfig(values, img);

  const files: GeneratedProject = {
    "package.json": JSON.stringify(PACKAGE_JSON, null, 2) + "\n",
    "next.config.js": T.NEXT_CONFIG,
    "tsconfig.json": T.TSCONFIG,
    "next-env.d.ts": T.NEXT_ENV,
    ".gitignore": T.GITIGNORE,
    ".env.example": T.ENV_EXAMPLE,
    "README.md": readme(cfg),
    "supabase/schema.sql": T.SCHEMA_SQL,
    "config/event.json": configJson(cfg),
    "lib/config.ts": T.LIB_CONFIG,
    "lib/strings.ts": stringsFile(),
    "lib/theme.ts": themeFile(),
    "lib/db.ts": T.LIB_DB,
    "lib/security.ts": T.LIB_SECURITY,
    "app/globals.css": THEME_CSS + T.ADMIN_CSS,
    "app/layout.tsx": T.APP_LAYOUT,
    "app/robots.ts": T.APP_ROBOTS,
    "app/page.tsx": T.APP_PAGE,
    "app/RsvpForm.tsx": T.APP_RSVP_FORM,
    "app/event.ics/route.ts": T.APP_ICS,
    "app/admin/page.tsx": T.APP_ADMIN_PAGE,
    "app/admin/LoginForm.tsx": T.APP_ADMIN_LOGIN,
    "app/admin/AdminTable.tsx": T.APP_ADMIN_TABLE,
    "app/api/rsvp/route.ts": T.API_RSVP,
    "app/api/admin/login/route.ts": T.API_LOGIN,
    "app/api/admin/logout/route.ts": T.API_LOGOUT,
    "app/api/admin/delete/route.ts": T.API_DELETE,
    "app/api/admin/export/route.ts": T.API_EXPORT,
  };

  if (img) files[`public/bg.${img.ext}`] = { base64: img.base64 };
  return files;
}
