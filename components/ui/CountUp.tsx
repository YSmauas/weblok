"use client";

import { useEffect, useState } from "react";
import { useInView } from "./Reveal";

/** מספר שעולה מ-0 לערך הסופי כשהוא נכנס למסך (ease-out, ~1.2 שניות). */
export function CountUp({ value, duration = 1200 }: { value: number | null; duration?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView || value === null) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value === 0) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return <span ref={ref}>{value === null ? "—" : shown.toLocaleString()}</span>;
}
