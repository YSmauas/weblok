import type { StructureField, StructureValues } from "../types";

/** קבוצות בפאנל העריכה (מפתחות i18n) */
const G = {
  event: "structures.rsvp.g.event",
  place: "structures.rsvp.g.place",
  form: "structures.rsvp.g.form",
  design: "structures.rsvp.g.design",
};

const f = (key: string) => `structures.rsvp.f.${key}`;
const o = (key: string) => `structures.rsvp.o.${key}`;

export const EVENT_TYPES = ["wedding", "mitzvah", "brit", "birthday", "corporate", "other"] as const;
export const THEMES = ["elegant", "modern", "floral", "night", "minimal", "festive"] as const;
export const FONTS = ["sans", "serif", "rounded", "classic"] as const;
export const LINK_MODES = ["auto", "custom", "off"] as const;
export const PHONE_MODES = ["optional", "required", "hidden"] as const;
export const TIME_ZONES = ["Asia/Jerusalem", "Europe/London", "Europe/Madrid", "America/New_York", "America/Los_Angeles", "UTC"] as const;

export const fields: StructureField[] = [
  // --- האירוע ---
  {
    id: "eventType",
    label: f("eventType"),
    type: "select",
    default: "wedding",
    group: G.event,
    options: EVENT_TYPES.map((v) => ({ value: v, label: o(`type.${v}`) })),
  },
  { id: "eyebrow", label: f("eyebrow"), type: "text", default: "", group: G.event, maxLength: 60, hint: f("eyebrowHint") },
  { id: "title", label: f("title"), type: "text", default: "נועה ואורי מתחתנים", group: G.event, maxLength: 120 },
  { id: "hosts", label: f("hosts"), type: "text", default: "יחד עם ההורים: משפחת כהן ומשפחת לוי", group: G.event, maxLength: 160 },
  { id: "date", label: f("date"), type: "date", default: "2026-12-17", group: G.event },
  { id: "time", label: f("time"), type: "time", default: "19:30", group: G.event },
  {
    id: "timeZone",
    label: f("timeZone"),
    type: "select",
    default: "Asia/Jerusalem",
    group: G.event,
    options: TIME_ZONES.map((v) => ({ value: v, label: o(`tz.${v.replace("/", "_")}`) })),
    hint: f("timeZoneHint"),
  },
  {
    id: "details",
    label: f("details"),
    type: "textarea",
    default: "נשמח לחגוג איתכם את היום המאושר בחיינו.\nקבלת פנים 19:30 · חופה 20:30",
    group: G.event,
    maxLength: 1500,
  },

  // --- מיקום ---
  { id: "venue", label: f("venue"), type: "text", default: "גני האירועים ״הגן הקסום״", group: G.place, maxLength: 120 },
  { id: "address", label: f("address"), type: "text", default: "דרך השדות 12, מושב בית זית", group: G.place, maxLength: 200 },
  {
    id: "wazeMode",
    label: f("wazeMode"),
    type: "select",
    default: "auto",
    group: G.place,
    options: LINK_MODES.map((v) => ({ value: v, label: o(`link.${v}`) })),
    hint: f("wazeHint"),
  },
  {
    id: "wazeUrl",
    label: f("wazeUrl"),
    type: "text",
    default: "",
    group: G.place,
    maxLength: 500,
    ltr: true,
    dependsOn: { field: "wazeMode", equals: ["custom"] },
    hint: f("wazeUrlHint"),
  },
  {
    id: "mapsMode",
    label: f("mapsMode"),
    type: "select",
    default: "auto",
    group: G.place,
    options: LINK_MODES.map((v) => ({ value: v, label: o(`link.${v}`) })),
  },
  {
    id: "mapsUrl",
    label: f("mapsUrl"),
    type: "text",
    default: "",
    group: G.place,
    maxLength: 500,
    ltr: true,
    dependsOn: { field: "mapsMode", equals: ["custom"] },
    hint: f("mapsUrlHint"),
  },

  // --- טופס האישור ---
  { id: "rsvpDeadline", label: f("rsvpDeadline"), type: "date", default: "2026-12-07", group: G.form, hint: f("rsvpDeadlineHint") },
  { id: "maxGuests", label: f("maxGuests"), type: "number", default: "6", group: G.form, min: 1, max: 20 },
  {
    id: "phoneMode",
    label: f("phoneMode"),
    type: "select",
    default: "optional",
    group: G.form,
    options: PHONE_MODES.map((v) => ({ value: v, label: o(`phone.${v}`) })),
  },
  { id: "thanks", label: f("thanks"), type: "text", default: "תודה! קיבלנו את התשובה שלכם 💛", group: G.form, maxLength: 200 },

  // --- עיצוב ---
  {
    id: "lang",
    label: f("lang"),
    type: "select",
    default: "he",
    group: G.design,
    options: [
      { value: "he", label: o("lang.he") },
      { value: "en", label: o("lang.en") },
    ],
    hint: f("langHint"),
  },
  {
    id: "dir",
    label: f("dir"),
    type: "select",
    default: "auto",
    group: G.design,
    options: [
      { value: "auto", label: o("dir.auto") },
      { value: "rtl", label: o("dir.rtl") },
      { value: "ltr", label: o("dir.ltr") },
    ],
  },
  {
    id: "theme",
    label: f("theme"),
    type: "select",
    default: "elegant",
    group: G.design,
    options: THEMES.map((v) => ({ value: v, label: o(`theme.${v}`) })),
  },
  { id: "accent", label: f("accent"), type: "color", default: "#b08d57", group: G.design },
  {
    id: "font",
    label: f("font"),
    type: "select",
    default: "serif",
    group: G.design,
    options: FONTS.map((v) => ({ value: v, label: o(`font.${v}`) })),
    hint: f("fontHint"),
  },
  { id: "bgImage", label: f("bgImage"), type: "image", default: "", group: G.design, hint: f("bgImageHint") },
  { id: "overlay", label: f("overlay"), type: "range", default: "45", group: G.design, min: 0, max: 90 },
];

export function defaultValues(): StructureValues {
  const v: StructureValues = {};
  fields.forEach((x) => (v[x.id] = x.default));
  return v;
}
