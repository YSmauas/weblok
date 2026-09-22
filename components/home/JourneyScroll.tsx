"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function JourneyScroll() {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const FEATURES = [
    { title: t("journey.f1.title"), text: t("journey.f1.text") },
    { title: t("journey.f2.title"), text: t("journey.f2.text") },
    { title: t("journey.f3.title"), text: t("journey.f3.text") },
    { title: t("journey.f4.title"), text: t("journey.f4.text") },
  ];

  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const raw = total > 0 ? -rect.top / total : 0;
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const activeIndex = Math.min(
    FEATURES.length - 1,
    Math.floor(progress * FEATURES.length)
  );

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - progress);

  return (
    <section
      ref={containerRef}
      style={{ height: `${FEATURES.length * 90}dvh` }}
      className="relative"
    >
      {/* h-screen (100vh) קופץ באנדרואיד/כרום כשסרגל הכתובת מתכווץ/מתרחב בזמן
          גלילה - זה בדיוק מה שגרם לתחושה שהגלילה "נתקעת" באמצע הסקשן. dvh
          (dynamic viewport height) עוקב אחרי הגובה האמיתי בזמן אמת. */}
      <div className="sticky top-0 h-[100dvh] flex items-center justify-center px-6">
        <div className="max-w-4xl w-full grid md:grid-cols-[220px_1fr] gap-12 items-center">
          <div className="relative w-[220px] h-[220px] mx-auto">
            <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90">
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth="2"
              />
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                style={{ transition: "stroke-dashoffset 0.1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-extrabold text-accent">
                {activeIndex + 1}
              </span>
              <span className="text-xs text-ink-muted">
                {t("journey.of")} {FEATURES.length}
              </span>
            </div>
          </div>

          <div className="text-center md:text-right">
            <h2 className="text-2xl md:text-[1.8rem] font-bold leading-snug transition-opacity duration-300">
              {FEATURES[activeIndex].title}
            </h2>
            <p className="mt-3 text-ink-secondary leading-relaxed max-w-md mx-auto md:mx-0 transition-opacity duration-300">
              {FEATURES[activeIndex].text}
            </p>
            <div className="mt-6 flex gap-2 justify-center md:justify-start">
              {FEATURES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex ? "w-6 bg-accent" : "w-1.5 bg-base-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
                }
