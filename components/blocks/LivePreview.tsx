"use client";

import { useEffect, useRef, useState } from "react";

export type Device = "mobile" | "tablet" | "desktop";
export const DEVICE_WIDTH: Record<Device, number> = { mobile: 360, tablet: 768, desktop: 1280 };

/**
 * תצוגה חיה של קוד אמיתי בתוך iframe מבודד, ברוחב של מכשיר אמיתי (360/768/1280)
 * שמוקטן כדי להיכנס למסגרת.
 *
 * - sandbox="allow-scripts" בלי allow-same-origin: הקוד לא יכול לגעת בעוגיות,
 *   ב-localStorage או ב-DOM של האתר שלנו (ר' SECURITY.md).
 * - בלי הבהובים: שני iframes ב"חציצה כפולה" - המסמך החדש נטען ברקע, ורק כשהוא
 *   מוכן מתחלף מול העיניים. העדכונים מושהים (debounce) בזמן הקלדה.
 * - replayKey: שינוי שלו טוען את המסמך מחדש (הפעלה חוזרת של אנימציות כניסה).
 */
export function LivePreview({
  doc,
  device,
  replayKey,
  title,
  className = "",
  debounceMs = 280,
}: {
  doc: string;
  device: Device;
  replayKey: number;
  title: string;
  className?: string;
  debounceMs?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  // שני "חריצים": [מסמך, מזהה טעינה]. active = החריץ המוצג.
  const [slots, setSlots] = useState<[string, string]>([doc, ""]);
  const [active, setActive] = useState(0);
  const pending = useRef<number | null>(null);
  const first = useRef(true);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // מסמך חדש / הפעלה חוזרת → נטען בחריץ הנסתר (אחרי השהיה קצרה)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      const next = 1 - active;
      pending.current = next;
      // הערת nonce: מבטיחה טעינה מחדש גם כשהתוכן זהה (replay)
      const stamped = `${doc}\n<!-- r${replayKey}-${Date.now()} -->`;
      setSlots((prev) => {
        const copy: [string, string] = [prev[0], prev[1]];
        copy[next] = stamped;
        return copy;
      });
    }, debounceMs);
    return () => window.clearTimeout(t);
    // active לא בתלויות בכוונה - ההחלפה עצמה לא אמורה לטעון שוב
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, replayKey, debounceMs]);

  const onLoad = (i: number) => {
    if (pending.current === i) {
      pending.current = null;
      setActive(i);
    }
  };

  const W = DEVICE_WIDTH[device];
  const scale = box.w ? Math.min(1, box.w / W) : 1;
  const frameH = box.h ? box.h / scale : 600;
  const bezel = device === "desktop" ? "" : "rounded-[18px] ring-1 ring-base-border";

  return (
    <div ref={boxRef} className={`relative w-full overflow-hidden ${className}`}>
      <div
        className={`absolute top-0 overflow-hidden bg-base-bg ${bezel}`}
        style={{
          width: W,
          height: frameH,
          // מרכוז פיזי (left) - זהה ב-RTL וב-LTR
          left: "50%",
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        {slots.map((s, i) =>
          s ? (
            <iframe
              key={i}
              title={title}
              srcDoc={s}
              sandbox="allow-scripts allow-forms allow-popups"
              referrerPolicy="no-referrer"
              onLoad={() => onLoad(i)}
              aria-hidden={i !== active}
              tabIndex={i === active ? 0 : -1}
              className="absolute inset-0 w-full h-full border-0 bg-transparent transition-opacity duration-150"
              style={{ opacity: i === active ? 1 : 0, pointerEvents: i === active ? "auto" : "none" }}
            />
          ) : null
        )}
      </div>
    </div>
  );
}
