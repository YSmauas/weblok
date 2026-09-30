/**
 * טקסטים מובנים של הווידג'ט המיוצא (לא של האתר שלנו) - לפי שפת הווידג'ט שהיוצר בחר.
 * {p} מוחלף בשם הספק. כל שפה חייבת את אותו סט מפתחות (נאכף ע"י הטיפוס).
 */
export type Lang = "he" | "en" | "es";

export interface WidgetStrings {
  defaultName: string;
  open: string;
  close: string;
  clear: string;
  keySettings: string;
  send: string;
  stop: string;
  placeholder: string;
  typing: string;
  stopped: string;
  truncated: string;
  you: string;
  noKey: string;
  setupTitle: string;
  setupIntro: string;
  provider: string;
  apiKey: string;
  getKey: string;
  remember: string;
  rememberHint: string;
  riskTitle: string;
  risk1: string;
  risk2: string;
  risk3: string;
  save: string;
  back: string;
  forget: string;
  forgotten: string;
  keyEmpty: string;
  keyBad: string;
  changeKey: string;
  err: {
    invalidKey: string;
    quotaDay: string;
    rate: string;
    credit: string;
    model: string;
    blocked: string;
    network: string;
    overloaded: string;
    timeout: string;
    truncatedEmpty: string;
    empty: string;
    failed: string;
  };
}

const he: WidgetStrings = {
  defaultName: "העוזר החכם",
  open: "פתיחת העוזר",
  close: "סגירה",
  clear: "ניקוי השיחה",
  keySettings: "הגדרות מפתח API",
  send: "שליחה",
  stop: "עצירת התשובה",
  placeholder: "כתבו הודעה…",
  typing: "העוזר כותב…",
  stopped: "התשובה נעצרה.",
  truncated: "(התשובה נקטעה - הגיעה למגבלת האורך)",
  you: "אתם",
  noKey: "צריך מפתח API",
  setupTitle: "חיבור לשירות AI",
  setupIntro: "העוזר עובד עם מפתח API אישי שלכם. המפתח נשמר רק בדפדפן הזה ונשלח ישירות לספק - לא לבעלי האתר ולא לשום שרת אחר.",
  provider: "ספק",
  apiKey: "מפתח API",
  getKey: "איך משיגים מפתח ל-{p}? ↗",
  remember: "לזכור את המפתח במכשיר הזה",
  rememberHint: "בלי סימון - המפתח נמחק כשסוגרים את הלשונית.",
  riskTitle: "חשוב לדעת",
  risk1: "כל מי שיש לו גישה לדפדפן הזה, תוסף דפדפן או קוד זדוני באתר יכול לקרוא את המפתח.",
  risk2: "השתמשו במפתח ייעודי ומוגבל (תקציב/מכסה), לא במפתח הראשי שלכם.",
  risk3: "אפשר למחוק את המפתח בכל רגע בכפתור \"שכחו את המפתח\".",
  save: "שמירה והתחלה",
  back: "חזרה לשיחה",
  forget: "שכחו את המפתח",
  forgotten: "המפתח נמחק מהדפדפן.",
  keyEmpty: "הדביקו מפתח API.",
  keyBad: "המפתח נראה לא תקין (בלי רווחים, לפחות 10 תווים).",
  changeKey: "עדכון המפתח",
  err: {
    invalidKey: "{p} דחה את המפתח (לא תקין, פג תוקף או בלי הרשאה). בדקו אותו או הזינו מפתח אחר.",
    quotaDay: "נגמרה המכסה היומית של המפתח ב-{p}. נסו שוב מחר או שדרגו את החשבון.",
    rate: "יותר מדי בקשות ל-{p} כרגע. חכו כמה שניות ונסו שוב.",
    credit: "אין מספיק קרדיט בחשבון {p}. הוסיפו קרדיט או השתמשו במפתח אחר.",
    model: "המודל שהוגדר לא זמין בחשבון {p}. פנו לבעלי האתר.",
    blocked: "{p} חסם את הבקשה או את התשובה (מסנן בטיחות). נסו לנסח אחרת.",
    network: "אין חיבור ל-{p}: בעיית רשת, חסימה בדפדפן או מדיניות אבטחה של האתר. נסו שוב.",
    overloaded: "השירות של {p} עמוס כרגע. נסו שוב בעוד רגע.",
    timeout: "{p} לא הגיב בזמן. נסו שוב.",
    truncatedEmpty: "התשובה נקטעה לפני שהתחילה (מגבלת אורך). נסו שאלה קצרה יותר.",
    empty: "התקבלה תשובה ריקה. נסו שוב.",
    failed: "משהו השתבש מול {p}. נסו שוב.",
  },
};

const en: WidgetStrings = {
  defaultName: "Smart Assistant",
  open: "Open assistant",
  close: "Close",
  clear: "Clear chat",
  keySettings: "API key settings",
  send: "Send",
  stop: "Stop response",
  placeholder: "Type a message…",
  typing: "Assistant is typing…",
  stopped: "Response stopped.",
  truncated: "(Response cut off - length limit reached)",
  you: "You",
  noKey: "API key needed",
  setupTitle: "Connect an AI service",
  setupIntro: "This assistant runs on your own API key. The key is stored only in this browser and sent directly to the provider - never to the site owner or any other server.",
  provider: "Provider",
  apiKey: "API key",
  getKey: "How to get a {p} key ↗",
  remember: "Remember the key on this device",
  rememberHint: "Unchecked - the key is deleted when you close the tab.",
  riskTitle: "Good to know",
  risk1: "Anyone with access to this browser, a browser extension, or malicious code on this site could read the key.",
  risk2: "Use a dedicated key with spending/usage limits, not your main key.",
  risk3: "You can delete the key at any time with \"Forget key\".",
  save: "Save and start",
  back: "Back to chat",
  forget: "Forget key",
  forgotten: "The key was removed from this browser.",
  keyEmpty: "Paste an API key.",
  keyBad: "That key looks invalid (no spaces, at least 10 characters).",
  changeKey: "Update key",
  err: {
    invalidKey: "{p} rejected the key (invalid, expired or missing permission). Check it or enter another key.",
    quotaDay: "The key's daily quota on {p} is used up. Try again tomorrow or upgrade the account.",
    rate: "Too many requests to {p} right now. Wait a few seconds and try again.",
    credit: "Not enough credit on the {p} account. Add credit or use another key.",
    model: "The configured model isn't available on this {p} account. Please contact the site owner.",
    blocked: "{p} blocked the request or the response (safety filter). Try rephrasing.",
    network: "Can't reach {p}: network problem, browser blocking, or this site's security policy. Try again.",
    overloaded: "{p} is overloaded right now. Try again in a moment.",
    timeout: "{p} didn't respond in time. Try again.",
    truncatedEmpty: "The response was cut off before it started (length limit). Try a shorter question.",
    empty: "Got an empty response. Try again.",
    failed: "Something went wrong with {p}. Try again.",
  },
};

const es: WidgetStrings = {
  defaultName: "Asistente inteligente",
  open: "Abrir asistente",
  close: "Cerrar",
  clear: "Borrar conversación",
  keySettings: "Ajustes de la clave API",
  send: "Enviar",
  stop: "Detener respuesta",
  placeholder: "Escribe un mensaje…",
  typing: "El asistente está escribiendo…",
  stopped: "Respuesta detenida.",
  truncated: "(Respuesta cortada: se alcanzó el límite de longitud)",
  you: "Tú",
  noKey: "Se necesita una clave API",
  setupTitle: "Conectar un servicio de IA",
  setupIntro: "Este asistente funciona con tu propia clave API. La clave se guarda solo en este navegador y se envía directamente al proveedor, nunca al dueño del sitio ni a otro servidor.",
  provider: "Proveedor",
  apiKey: "Clave API",
  getKey: "Cómo obtener una clave de {p} ↗",
  remember: "Recordar la clave en este dispositivo",
  rememberHint: "Sin marcar: la clave se borra al cerrar la pestaña.",
  riskTitle: "Importante",
  risk1: "Cualquiera con acceso a este navegador, una extensión o código malicioso en este sitio podría leer la clave.",
  risk2: "Usa una clave dedicada con límites de gasto/uso, no tu clave principal.",
  risk3: "Puedes borrar la clave en cualquier momento con \"Olvidar clave\".",
  save: "Guardar y empezar",
  back: "Volver al chat",
  forget: "Olvidar clave",
  forgotten: "La clave se borró de este navegador.",
  keyEmpty: "Pega una clave API.",
  keyBad: "La clave no parece válida (sin espacios, al menos 10 caracteres).",
  changeKey: "Actualizar clave",
  err: {
    invalidKey: "{p} rechazó la clave (no válida, caducada o sin permisos). Revísala o introduce otra.",
    quotaDay: "Se agotó la cuota diaria de la clave en {p}. Inténtalo mañana o mejora la cuenta.",
    rate: "Demasiadas solicitudes a {p} ahora mismo. Espera unos segundos y vuelve a intentarlo.",
    credit: "No hay crédito suficiente en la cuenta de {p}. Añade crédito o usa otra clave.",
    model: "El modelo configurado no está disponible en esta cuenta de {p}. Contacta con el dueño del sitio.",
    blocked: "{p} bloqueó la solicitud o la respuesta (filtro de seguridad). Prueba a reformularla.",
    network: "No se puede conectar con {p}: problema de red, bloqueo del navegador o política de seguridad del sitio. Inténtalo de nuevo.",
    overloaded: "{p} está saturado ahora mismo. Inténtalo en un momento.",
    timeout: "{p} no respondió a tiempo. Inténtalo de nuevo.",
    truncatedEmpty: "La respuesta se cortó antes de empezar (límite de longitud). Prueba una pregunta más corta.",
    empty: "Se recibió una respuesta vacía. Inténtalo de nuevo.",
    failed: "Algo salió mal con {p}. Inténtalo de nuevo.",
  },
};

export const STRINGS: Record<Lang, WidgetStrings> = { he, en, es };
