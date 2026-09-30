"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * בועת הסבר/תוכן קטנה שנפתחת בלחיצה על כפתור - רכיב כללי לכל האתר.
 *
 * - רקע אטום (טוקן panel) + מסגרת + צל, טקסט ink-primary: ניגודיות AA בכהה ובבהיר.
 * - מרונדר ב-portal ל-body עם position: fixed - לא נחתך ע"י overflow של הורים.
 * - מיקום: מתחת לכפתור, ואם אין מקום - מעליו; אופקית מיושר לתחילת הכפתור
 *   (RTL/LTR לפי ה-dir של המסמך) ונצמד לשולי המסך (8px). מחושב מחדש בגלילה/שינוי גודל.
 * - נסגר בלחיצה מחוץ לבועה, ב-ESC (הפוקוס חוזר לכפתור), ובלחיצה חוזרת על הכפתור.
 * - נגישות: role="tooltip" + aria-describedby (ברירת מחדל, לטקסט הסבר) או
 *   role="dialog" + aria-controls (לתוכן אינטראקטיבי).
 */

const GAP = 8; // רווח בין הכפתור לבועה
const EDGE = 8; // מרחק מינימלי משולי המסך

type Pos = { top: number; left: number; arrowX: number; side: "top" | "bottom" };

export function Popover({
  trigger,
  children,
  label,
  role = "tooltip",
  width = 288,
  className = "",
  triggerClassName = "",
}: {
  /** תוכן הכפתור (אייקון/טקסט) */
  trigger: ReactNode;
  /** תוכן הבועה */
  children: ReactNode;
  /** שם נגיש לכפתור */
  label: string;
  role?: "tooltip" | "dialog";
  /** רוחב מקסימלי בפיקסלים (במסך צר - רוחב המסך פחות שוליים) */
  width?: number;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const btn = btnRef.current;
    const box = boxRef.current;
    if (!btn || !box) return;
    const vw = document.documentElement.clientWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const r = btn.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    const rtl = getComputedStyle(btn).direction === "rtl";

    // אופקי: יישור לתחילת הכפתור, ואז הצמדה לגבולות המסך
    let left = rtl ? r.right - b.width : r.left;
    left = Math.min(Math.max(left, EDGE), Math.max(EDGE, vw - b.width - EDGE));

    // אנכי: מתחת כברירת מחדל; מעל אם אין מקום מתחת ויש יותר מקום מעל
    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const side: Pos["side"] = b.height > below && above > below ? "top" : "bottom";
    let top = side === "bottom" ? r.bottom + GAP : r.top - GAP - b.height;
    top = Math.min(Math.max(top, EDGE), Math.max(EDGE, vh - b.height - EDGE));

    const arrowX = Math.min(Math.max(r.left + r.width / 2 - left, 14), b.width - 14);
    setPos({ top, left, arrowX, side });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || boxRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onMove = () => place();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    window.visualViewport?.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
      window.visualViewport?.removeEventListener("resize", onMove);
    };
  }, [open, place]);

  const boxId = `pop-${id.replace(/:/g, "")}`;
  const a11y =
    role === "tooltip"
      ? { "aria-describedby": open ? boxId : undefined }
      : { "aria-controls": open ? boxId : undefined, "aria-haspopup": "dialog" as const };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
        {...a11y}
      >
        {trigger}
      </button>
      {open &&
        mounted &&
        createPortal(
          <div
            ref={boxRef}
            id={boxId}
            role={role}
            aria-label={role === "dialog" ? label : undefined}
            style={{
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              width: `min(${width}px, calc(100vw - ${EDGE * 2}px))`,
              visibility: pos ? "visible" : "hidden",
            }}
            className={`fixed z-[1000] rounded-xl border border-base-border bg-base-panel text-ink-primary p-3.5 text-[13px] leading-relaxed shadow-[0_18px_50px_-12px_rgba(0,0,0,0.55),0_0_0_1px_rgba(0,0,0,0.04)] animate-fadeInUp ${className}`}
          >
            {pos && (
              <span
                aria-hidden="true"
                className={`absolute w-2.5 h-2.5 rotate-45 bg-base-panel border-base-border ${
                  pos.side === "bottom" ? "-top-[6px] border-t border-l" : "-bottom-[6px] border-b border-r"
                }`}
                style={{ left: pos.arrowX - 5 }}
              />
            )}
            <div className="relative">{children}</div>
          </div>,
          document.body
        )}
    </>
  );
}
