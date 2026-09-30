import type { SnippetId } from "./snippets";

/**
 * תוכן מדריך העוגיות בשלוש השפות. זה תוכן מאמר ארוך (לא מחרוזות ממשק), ולכן
 * הוא יושב כאן כיחידה אחת לכל שפה ולא כעשרות מפתחות בקבצי ה-i18n.
 */

export interface GuideSection {
  id: string;
  h: string;
  p?: string[];
  list?: string[];
  code?: SnippetId;
  codeLabel?: string;
  after?: string[];
}

export interface GuideContent {
  title: string;
  lead: string;
  toc: string;
  copy: string;
  copied: string;
  back: string;
  openEditor: string;
  sections: GuideSection[];
}

const he: GuideContent = {
  title: "מדריך: הסכמת עוגיות שבאמת עובדת",
  lead: "פופאפ העוגיות של WEblok שומר את בחירת המבקר ומודיע עליה - אבל הוא לא יודע אילו סקריפטים יש באתר שלכם. המדריך הזה מראה איך לחבר אליו את Google Analytics (ובעצם כל סקריפט מעקב), כך שהם ירוצו רק אחרי אישור, והעוגיות שלהם יימחקו בדחייה.",
  toc: "בדף הזה",
  copy: "העתקה",
  copied: "הועתק!",
  back: "חזרה לעורך הפופאפ",
  openEditor: "פתיחת עורך הפופאפ",
  sections: [
    {
      id: "how",
      h: "מה הפופאפ עושה - ומה לא",
      p: [
        "כשמבקר לוחץ \"אישור\" או \"דחייה\", הפופאפ שומר את הבחירה בדפדפן ושולח אירוע. בביקורים הבאים הוא לא מוצג שוב.",
        "מה שהוא לא עושה לבד: לחסום סקריפטים שכבר מוטמעים בעמוד. אם תג Google Analytics מודבק באתר כרגיל - הוא ירוץ ויכתוב עוגיות עוד לפני שהמבקר בחר משהו. לכן השלב החשוב הוא להפסיק לטעון סקריפטי מעקב \"סתם\", ולטעון אותם רק דרך אחד המתכונים בהמשך.",
      ],
    },
    {
      id: "contract",
      h: "החוזה: מפתח אחסון ואירוע",
      p: ["כל המתכונים נשענים על שני דברים קבועים, שלא משתנים גם כשעורכים את טקסט הפופאפ:"],
      code: "contract",
      after: [
        "הבחירה נשמרת תחת המפתח wbp-cookie ב-localStorage, עם הערך accepted או declined.",
        "האירוע weblok:consent נשלח על document בכל לחיצה, עם e.detail.choice. חשוב: הוא לא נשלח בטעינת העמוד למבקר חוזר - לכן כל מתכון קורא גם את הערך השמור בטעינה.",
      ],
    },
    {
      id: "ga",
      h: "מתכון 1: Google Analytics רק אחרי אישור, ומחיקת העוגיות בדחייה",
      p: [
        "זה המתכון המומלץ לרוב האתרים. מחקו מהאתר את תג ה-gtag הרגיל, והדביקו במקומו את הקוד הזה אחרי קוד הפופאפ. החליפו את G-XXXXXXXXXX במזהה המדידה שלכם.",
      ],
      code: "ga",
      codeLabel: "consent-analytics.html",
      list: [
        "אישור: הסקריפט של Google נטען רק ברגע הזה (ובכל טעינה הבאה).",
        "דחייה: העוגיות _ga, _ga_*, _gid ו-_gat* נמחקות - גם בדומיין הנוכחי, גם בדומיינים שמעליו (למשל ‎.example.com) וגם בנתיבים של העמוד, כי כך Analytics כותב אותן.",
        "מבקר שחזר בו מאישור (דרך כפתור העוגייה) - Analytics נעצר מיד בעמוד הנוכחי והעוגיות נמחקות.",
      ],
    },
    {
      id: "any",
      h: "מתכון 2: כל סקריפט אחר (פיקסל, צ'אט, מפות חום)",
      p: [
        "שיטה כללית שעובדת עם כל קוד צד שלישי: משנים את type של תג הסקריפט ל-text/plain, והדפדפן פשוט לא מריץ אותו. אחרי אישור, הקוד הקטן הזה \"מפעיל\" את כל התגים המסומנים.",
      ],
      code: "blocked",
      codeLabel: "consent-scripts.html",
    },
    {
      id: "consent-mode",
      h: "מתכון 3: Google Consent Mode v2",
      p: [
        "אם אתם משתמשים ב-Google Ads או רוצים שהמודלים של Google ישלימו נתונים חסרים, Google דורשת Consent Mode v2. כאן התג של Google נטען תמיד, אבל במצב \"denied\" עד שהמבקר מאשר. הקוד חייב להופיע ב-<head> לפני כל תג אחר של Google.",
      ],
      code: "consentMode",
      codeLabel: "consent-mode-v2.html",
      after: [
        "שימו לב: זה \"מצב מתקדם\" - Google עדיין מקבלת פינגים אנונימיים בלי עוגיות גם לפני אישור. אם אתם רוצים שלא תישלח שום בקשה לפני הסכמה (\"מצב בסיסי\"), השתמשו במתכון 1. ואם מבקר מאשר ואז מבטל - שלבו גם את deleteAnalyticsCookies ממתכון 1.",
      ],
    },
    {
      id: "change",
      h: "לאפשר למבקרים לשנות את דעתם",
      p: [
        "בעורך, בקבוצת \"התנהגות\", הפעילו \"כפתור לשינוי הבחירה\": אחרי הבחירה יופיע כפתור עוגייה קטן בפינה שפותח את הפופאפ מחדש. כל בחירה חדשה שולחת שוב את weblok:consent, כך שהמתכונים למעלה מטפלים בה אוטומטית.",
      ],
    },
    {
      id: "test",
      h: "איך לבדוק שזה באמת עובד",
      list: [
        "פתחו את האתר בחלון גלישה בסתר, ובכלי המפתחים (F12) בלשונית Application → Cookies: לפני בחירה לא אמורה להופיע אף עוגייה שמתחילה ב-_ga.",
        "בלשונית Network סננו לפי collect או googletagmanager: לפני אישור - אין בקשות (במתכונים 1 ו-2).",
        "לחצו \"אישור\" - הבקשות והעוגיות מופיעות. רעננו - הפופאפ לא מוצג, והמעקב נטען שוב.",
        "כדי לראות את הפופאפ מחדש, הריצו בקונסול:",
      ],
      code: "reset",
    },
    {
      id: "limits",
      h: "מגבלות שכדאי להכיר",
      list: [
        "עוגיות HttpOnly (שנכתבות ע\"י השרת) ועוגיות של דומיינים אחרים (למשל doubleclick.net) אי אפשר למחוק מ-JavaScript באתר שלכם. הן נחסמות מראש רק אם הסקריפט שכותב אותן לא נטען.",
        "localStorage הוא לכל דומיין בנפרד: www.example.com ו-shop.example.com יציגו כל אחד את הפופאפ פעם אחת.",
        "המדריך הזה טכני ואינו ייעוץ משפטי - את נוסח הפופאפ ומדיניות הפרטיות כדאי לתאם לדין שחל עליכם (GDPR, תיקון 13 לחוק הגנת הפרטיות וכו').",
      ],
    },
  ],
};

const en: GuideContent = {
  title: "Guide: cookie consent that actually works",
  lead: "The WEblok cookie popup stores the visitor's choice and announces it - but it can't know which scripts run on your site. This guide shows how to wire Google Analytics (and really any tracking script) to it, so they run only after the visitor accepts, and their cookies are deleted when the visitor declines.",
  toc: "On this page",
  copy: "Copy",
  copied: "Copied!",
  back: "Back to the popup editor",
  openEditor: "Open the popup editor",
  sections: [
    {
      id: "how",
      h: "What the popup does - and what it doesn't",
      p: [
        "When a visitor clicks \"Accept\" or \"Decline\", the popup stores the choice in the browser and fires an event. On later visits it stays hidden.",
        "What it can't do by itself: block scripts that are already embedded in the page. If a Google Analytics tag is pasted into your site the usual way, it runs and writes cookies before the visitor chooses anything. So the key step is to stop loading tracking scripts unconditionally, and load them only through one of the recipes below.",
      ],
    },
    {
      id: "contract",
      h: "The contract: a storage key and an event",
      p: ["All recipes rely on two fixed things that never change, even when you edit the popup text:"],
      code: "contract",
      after: [
        "The choice is stored in localStorage under the key wbp-cookie, with the value accepted or declined.",
        "The weblok:consent event is fired on document on every click, with e.detail.choice. Important: it is not fired on page load for returning visitors - that's why every recipe also reads the stored value on load.",
      ],
    },
    {
      id: "ga",
      h: "Recipe 1: Google Analytics only after consent, cookies deleted on decline",
      p: [
        "The recommended recipe for most sites. Remove the regular gtag snippet from your site and paste this after the popup code instead. Replace G-XXXXXXXXXX with your measurement ID.",
      ],
      code: "ga",
      codeLabel: "consent-analytics.html",
      list: [
        "Accept: Google's script is loaded only at this moment (and on every later page load).",
        "Decline: the _ga, _ga_*, _gid and _gat* cookies are deleted - on the current host, its parent domains (e.g. .example.com) and the page's paths, because that's where Analytics writes them.",
        "A visitor who withdraws consent (via the cookie button): Analytics stops immediately on the current page and its cookies are deleted.",
      ],
    },
    {
      id: "any",
      h: "Recipe 2: any other script (pixels, chat, heatmaps)",
      p: [
        "A generic method that works with any third-party code: change the script tag's type to text/plain and the browser simply won't run it. After consent, this small snippet \"activates\" every marked tag.",
      ],
      code: "blocked",
      codeLabel: "consent-scripts.html",
    },
    {
      id: "consent-mode",
      h: "Recipe 3: Google Consent Mode v2",
      p: [
        "If you use Google Ads, or want Google's models to fill in missing data, Google requires Consent Mode v2. Here the Google tag always loads, but in \"denied\" mode until the visitor accepts. This code must be in <head>, before any other Google tag.",
      ],
      code: "consentMode",
      codeLabel: "consent-mode-v2.html",
      after: [
        "Note: this is \"advanced mode\" - Google still receives anonymous cookieless pings before consent. If you want no request at all before consent (\"basic mode\"), use Recipe 1. And if a visitor accepts and later declines, also combine deleteAnalyticsCookies from Recipe 1.",
      ],
    },
    {
      id: "change",
      h: "Let visitors change their mind",
      p: [
        "In the editor, under \"Behavior\", enable \"Button to change the choice\": after choosing, a small cookie button appears in the corner and reopens the popup. Each new choice fires weblok:consent again, so the recipes above handle it automatically.",
      ],
    },
    {
      id: "test",
      h: "How to check that it really works",
      list: [
        "Open your site in a private window and, in DevTools (F12) → Application → Cookies, make sure no cookie starting with _ga appears before a choice is made.",
        "In the Network tab filter by collect or googletagmanager: before accepting there are no requests (Recipes 1 and 2).",
        "Click \"Accept\" - requests and cookies appear. Reload - the popup stays hidden and tracking loads again.",
        "To see the popup again, run this in the console:",
      ],
      code: "reset",
    },
    {
      id: "limits",
      h: "Limitations worth knowing",
      list: [
        "HttpOnly cookies (written by a server) and cookies of other domains (e.g. doubleclick.net) can't be deleted by JavaScript on your site. They are prevented only by not loading the script that writes them.",
        "localStorage is per origin: www.example.com and shop.example.com will each show the popup once.",
        "This guide is technical, not legal advice - align the popup wording and your privacy policy with the law that applies to you (GDPR, ePrivacy, etc.).",
      ],
    },
  ],
};

const es: GuideContent = {
  title: "Guía: consentimiento de cookies que realmente funciona",
  lead: "El popup de cookies de WEblok guarda la elección del visitante y la anuncia, pero no puede saber qué scripts hay en tu sitio. Esta guía muestra cómo conectar Google Analytics (y en realidad cualquier script de seguimiento) para que solo se ejecuten después de aceptar, y sus cookies se borren al rechazar.",
  toc: "En esta página",
  copy: "Copiar",
  copied: "¡Copiado!",
  back: "Volver al editor del popup",
  openEditor: "Abrir el editor del popup",
  sections: [
    {
      id: "how",
      h: "Qué hace el popup y qué no",
      p: [
        "Cuando un visitante pulsa \"Aceptar\" o \"Rechazar\", el popup guarda la elección en el navegador y emite un evento. En visitas posteriores ya no se muestra.",
        "Lo que no puede hacer por sí solo: bloquear scripts que ya están incrustados en la página. Si la etiqueta de Google Analytics está pegada de la forma habitual, se ejecuta y escribe cookies antes de que el visitante elija nada. Por eso el paso clave es dejar de cargar scripts de seguimiento sin condiciones y cargarlos solo mediante una de las recetas siguientes.",
      ],
    },
    {
      id: "contract",
      h: "El contrato: una clave de almacenamiento y un evento",
      p: ["Todas las recetas se basan en dos elementos fijos que no cambian aunque edites el texto del popup:"],
      code: "contract",
      after: [
        "La elección se guarda en localStorage con la clave wbp-cookie y el valor accepted o declined.",
        "El evento weblok:consent se emite en document con cada clic, con e.detail.choice. Importante: no se emite al cargar la página para visitantes recurrentes; por eso cada receta también lee el valor guardado al cargar.",
      ],
    },
    {
      id: "ga",
      h: "Receta 1: Google Analytics solo tras aceptar, y borrado de cookies al rechazar",
      p: [
        "La receta recomendada para la mayoría de sitios. Quita de tu sitio la etiqueta gtag habitual y pega este código después del código del popup. Sustituye G-XXXXXXXXXX por tu ID de medición.",
      ],
      code: "ga",
      codeLabel: "consent-analytics.html",
      list: [
        "Aceptar: el script de Google se carga solo en ese momento (y en cada carga posterior).",
        "Rechazar: se borran las cookies _ga, _ga_*, _gid y _gat*, en el host actual, en sus dominios superiores (p. ej. .example.com) y en las rutas de la página, porque ahí las escribe Analytics.",
        "Un visitante que retira el consentimiento (con el botón de cookie): Analytics se detiene al instante en la página actual y sus cookies se borran.",
      ],
    },
    {
      id: "any",
      h: "Receta 2: cualquier otro script (píxeles, chat, mapas de calor)",
      p: [
        "Un método genérico que funciona con cualquier código de terceros: cambia el type de la etiqueta script a text/plain y el navegador simplemente no lo ejecuta. Tras el consentimiento, este pequeño código \"activa\" todas las etiquetas marcadas.",
      ],
      code: "blocked",
      codeLabel: "consent-scripts.html",
    },
    {
      id: "consent-mode",
      h: "Receta 3: Google Consent Mode v2",
      p: [
        "Si usas Google Ads o quieres que los modelos de Google completen datos que faltan, Google exige Consent Mode v2. Aquí la etiqueta de Google se carga siempre, pero en modo \"denied\" hasta que el visitante acepta. Este código debe ir en <head>, antes de cualquier otra etiqueta de Google.",
      ],
      code: "consentMode",
      codeLabel: "consent-mode-v2.html",
      after: [
        "Nota: este es el \"modo avanzado\": Google sigue recibiendo pings anónimos sin cookies antes del consentimiento. Si no quieres ninguna solicitud antes del consentimiento (\"modo básico\"), usa la Receta 1. Y si un visitante acepta y luego rechaza, combina también deleteAnalyticsCookies de la Receta 1.",
      ],
    },
    {
      id: "change",
      h: "Permitir que los visitantes cambien de opinión",
      p: [
        "En el editor, en \"Comportamiento\", activa \"Botón para cambiar la elección\": tras elegir aparece un pequeño botón de cookie en la esquina que vuelve a abrir el popup. Cada nueva elección emite de nuevo weblok:consent, así que las recetas anteriores la gestionan automáticamente.",
      ],
    },
    {
      id: "test",
      h: "Cómo comprobar que realmente funciona",
      list: [
        "Abre tu sitio en una ventana privada y, en DevTools (F12) → Application → Cookies, comprueba que no aparece ninguna cookie que empiece por _ga antes de elegir.",
        "En la pestaña Network filtra por collect o googletagmanager: antes de aceptar no hay solicitudes (Recetas 1 y 2).",
        "Pulsa \"Aceptar\": aparecen solicitudes y cookies. Recarga: el popup no se muestra y el seguimiento vuelve a cargarse.",
        "Para volver a ver el popup, ejecuta en la consola:",
      ],
      code: "reset",
    },
    {
      id: "limits",
      h: "Limitaciones que conviene conocer",
      list: [
        "Las cookies HttpOnly (escritas por un servidor) y las de otros dominios (p. ej. doubleclick.net) no se pueden borrar con JavaScript desde tu sitio. Solo se evitan no cargando el script que las escribe.",
        "localStorage es por origen: www.example.com y shop.example.com mostrarán cada uno el popup una vez.",
        "Esta guía es técnica, no asesoramiento legal: ajusta el texto del popup y tu política de privacidad a la ley que te aplique (RGPD, ePrivacy, etc.).",
      ],
    },
  ],
};

export const GUIDE: Record<"he" | "en" | "es", GuideContent> = { he, en, es };
