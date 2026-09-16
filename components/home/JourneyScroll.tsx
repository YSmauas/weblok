"use client";

import { useEffect, useRef, useState } from "react";

const FEATURES = [
  {
    title: "בלוקים מוכנים, לא תבניות",
    text: "כל בלוק בנוי לעריכה חיה - משנים ערכים ורואים תוצאה מיידית, בלי לגעת בקוד.",
  },
  {
    title: "מפתחות API בטוחים",
    text: "המפתחות שלכם נשמרים בצד שרת בלבד. קוד ההטמעה שיוצא לאתר שלכם לעולם לא חושף אותם.",
  },
  {
    title: "עריכה עם AI",
    text: "משתמשים רשומים עם מפתח API אישי יכולים לבקש מה-AI לעדכן ולשפר את העיצוב ישירות.",
  },
  {
    title: "מהעורך לאתר החי",
    text: "מעתיקים קטע קוד קצר אחד ומדביקים אותו באתר - הבלוק עולה לאוויר מיד.",
  },
];

export function JourneyScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

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
      style={{ height: `${FEATURES.length * 90}vh` }}
      className="relative"
    >
      <div className="sticky top-0 h-screen flex items-center justify-center px-6">
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
                מתוך {FEATURES.length}
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
