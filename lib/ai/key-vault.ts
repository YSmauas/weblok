"use client";

/**
 * כספת מפתחות בדפדפן. מפתח API ש"נשמר בדפדפן בלבד" לא נשמר כטקסט גלוי:
 * הוא מוצפן ב-AES-GCM עם מפתח הצפנה שנוצר בדפדפן כ-non-extractable ונשמר
 * ב-IndexedDB. כך גם מי שמעתיק את ה-localStorage (תוסף זדוני, גיבוי, דיבאג)
 * מקבל רק צופן - את מפתח ההצפנה עצמו אי אפשר לייצא מהדפדפן.
 */

const DB_NAME = "weblok-vault";
const STORE = "keys";
const WRAP_KEY_ID = "aes-gcm";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idb<T>(db: IDBDatabase, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

async function getWrapKey(): Promise<CryptoKey> {
  const db = await openDb();
  try {
    const existing = await idb<CryptoKey | undefined>(db, "readonly", (s) => s.get(WRAP_KEY_ID));
    if (existing) return existing;
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    await idb(db, "readwrite", (s) => s.put(key, WRAP_KEY_ID));
    return key;
  } finally {
    db.close();
  }
}

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...Array.from(bytes)));
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/** מצפין מחרוזת → base64(iv[12] | ciphertext) */
export async function encryptForBrowser(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await getWrapKey(), new TextEncoder().encode(plain));
  const out = new Uint8Array(12 + cipher.byteLength);
  out.set(iv);
  out.set(new Uint8Array(cipher), 12);
  return toB64(out);
}

export async function decryptFromBrowser(payload: string): Promise<string> {
  const bytes = fromB64(payload);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.subarray(0, 12) }, await getWrapKey(), bytes.subarray(12));
  return new TextDecoder().decode(plain);
}
