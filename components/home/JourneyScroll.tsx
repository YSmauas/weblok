"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Reveal } from "@/components/ui/Reveal";

/** מרחק גלילה (px) לכל "טיפ" - בערך גלגלת עכבר אחת. אותו מרחק לכל טיפ, בלי קשר לאורך הגלילה. */
const STEP_PX = 150;
/** כמה זמן הטיפ האחרון נשאר דבוק לפני שממשיכים הלאה */
const TAIL_PX = 90;
/** גובה האזור הדביק. קטן בכוונה: אין "מסך שלם" ריק לפני ואחרי */
const PIN_H = 400;
/** מתחת להדר הדביק */
const MIN_TOP = 88;

const RADIUS = 90;
const CIRC = 2 * Math.PI * RADIUS;
/** קפיץ מעט "חי": מתקרב ליעד, חולף עליו קצת וחוזר */
const STIFFNESS = 180;
const DAMPING = 16;

export function JourneyScroll() {
  const { t } = useLocale();
  const containerRef = useRef<HTMLElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const stickTopRef = useRef(MIN_TOP);
  const posRef = useRef(0);
  const velRef = useRef(0);
  const rafRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [stickTop, setStickTop] = useState(MIN_TOP);

  const FEATURES = [
    { title: t("journey.f1.title"), text: t("journey.f1.text") },
    { title: t("journey.f2.title"), text: t("journey.f2.text") },
    { title: t("journey.f3.title"), text: t("journey.f3.text") },
    { title: t("journey.f4.title"), text: t("journey.f4.text") },
  ];
  const N = FEATURES.length;
  if (posRef.current === 0) posRef.current = 1 / N;

  // הטיפ הנוכחי נקבע לפי מרחק גלילה קבוע לכל טיפ (לא לפי אחוז מסך)
  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      const el = containerRef.current;
      if (!el) return;
      const scrolled = stickTopRef.current - el.getBoundingClientRect().top;
      const i = Math.min(N - 1, Math.max(0, Math.floor(scrolled / STEP_PX)));
      setIndex((prev) => (prev === i ? prev : i));
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    const onResize = () => {
      const top = Math.max(MIN_TOP, Math.round((window.innerHeight - PIN_H) / 2));
      stickTopRef.current = top;
      setStickTop(top);
      onScroll();
    };

    onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [N]);

  // קפיץ לקשת ההתקדמות: קופצת לטיפ הבא ומתייצבת עם תנועה קטנה בסוף
  useEffect(() => {
    const target = (index + 1) / N;
    const paint = (x: number) =>
      arcRef.current?.setAttribute("stroke-dashoffset", String(CIRC * (1 - Math.min(1, Math.max(0, x)))));

    cancelAnimationFrame(rafRef.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      posRef.current = target;
      velRef.current = 0;
      paint(target);
      return;
    }

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const accel = -STIFFNESS * (posRef.current - target) - DAMPING * velRef.current;
      velRef.current += accel * dt;
      posRef.current += velRef.current * dt;
      paint(posRef.current);
      if (Math.abs(posRef.current - target) < 0.0004 && Math.abs(velRef.current) < 0.002) {
        posRef.current = target;
        velRef.current = 0;
        paint(target);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [index, N]);

  const goTo = (i: number) => {
    const el = containerRef.current;
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top - stickTopRef.current + (i + 0.5) * STEP_PX;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <>
    {/* במובייל: כרטיסים רגילים. גלילה "דביקה" מתישה באצבע */}
    <section className="md:hidden px-4 py-10 space-y-4">
      {FEATURES.map((f, i) => (
        <Reveal key={f.title} delay={i * 60} className="rounded-card border border-base-border bg-base-panel/60 p-5">
          <span className="w-7 h-7 rounded-full bg-accent text-base-bg text-sm font-bold inline-flex items-center justify-center">
            {i + 1}
          </span>
          <h2 className="text-lg font-bold mt-3">{f.title}</h2>
          <p className="mt-1.5 text-sm text-ink-secondary leading-relaxed">{f.text}</p>
        </Reveal>
      ))}
    </section>

    <section
      ref={containerRef}
      style={{ height: PIN_H + (N - 1) * STEP_PX + TAIL_PX }}
      className="relative hidden md:block"
    >
      <div className="sticky flex items-center justify-center px-6" style={{ top: stickTop, height: PIN_H }}>
        <div className="max-w-4xl w-full grid md:grid-cols-[220px_1fr] gap-12 items-center">
          <div className="relative w-[220px] h-[220px] mx-auto">
            <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="2" />
              <circle
                ref={arcRef}
                cx="110"
                cy="110"
                r={RADIUS}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - 1 / N)}
              />
            </svg>

            {/* נקודת עצירה לכל טיפ, על הטבעת עצמה */}
            {FEATURES.map((f, i) => {
              const angle = -Math.PI / 2 + ((i + 1) / N) * 2 * Math.PI;
              const reached = i <= index;
              const current = i === index;
              return (
                <button
                  key={f.title}
                  type="button"
                  onClick={() => goTo(i)}
                  title={f.title}
                  aria-label={`${i + 1}. ${f.title}`}
                  aria-current={current ? "step" : undefined}
                  className={`absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border text-xs font-bold inline-flex items-center justify-center transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                    reached
                      ? "bg-accent border-accent text-base-bg"
                      : "bg-base-panel border-base-border text-ink-muted hover:border-accent"
                  } ${current ? "scale-125" : ""}`}
                  style={{
                    left: `${((110 + RADIUS * Math.cos(angle)) / 220) * 100}%`,
                    top: `${((110 + RADIUS * Math.sin(angle)) / 220) * 100}%`,
                    boxShadow: current ? "0 0 0 6px var(--accent-soft)" : undefined,
                  }}
                >
                  {i + 1}
                </button>
              );
            })}

            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-3xl font-extrabold text-accent">{index + 1}</span>
              <span className="text-xs text-ink-muted">
                {t("journey.of")} {N}
              </span>
            </div>
          </div>

          <div key={index} className="text-center md:text-start animate-fadeInUp">
            <h2 className="text-2xl md:text-[1.8rem] font-bold leading-snug">{FEATURES[index].title}</h2>
            <p className="mt-3 text-ink-secondary leading-relaxed max-w-md mx-auto md:mx-0">{FEATURES[index].text}</p>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
