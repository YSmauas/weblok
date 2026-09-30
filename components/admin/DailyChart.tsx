import { T } from "@/components/ui/T";

export interface DailyPoint {
  day: string;
  value: number;
}

/**
 * גרף עמודות יומי (Server Component, בלי ספרייה).
 * תיקונים מול הגרסה הקודמת: לכל סדרה סקאלה משלה (כניסות "נעלמו" ליד ביקורים),
 * ציר Y עם קווי עזר וערכים, ערך מספרי גלוי מעל כל עמודה (title לא עובד במובייל),
 * גובה קבוע בפיקסלים לאזור העמודות (האחוזים לא "נמרחו" על התווית), ותוויות
 * תאריך מדוללות במסכים צרים. הציר תמיד משמאל לימין (ציר זמן), גם ב-RTL.
 */
export function DailyChart({
  data,
  titleKey,
  tone = "accent",
}: {
  data: DailyPoint[];
  titleKey: string;
  tone?: "accent" | "muted";
}) {
  const max = Math.max(0, ...data.map((d) => d.value));
  // קצה עליון "עגול" לסקאלה (1, 2, 5, 10, 20, 50...) - קווי עזר קריאים
  const niceMax = max <= 4 ? 4 : niceCeil(max);
  const total = data.reduce((n, d) => n + d.value, 0);
  const bar = tone === "accent" ? "bg-accent" : "bg-ink-secondary";
  const fmtDay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-sm font-semibold">
          <T k={titleKey} />
        </span>
        <span className="text-xs text-ink-muted tabular-nums">
          <T k="admin.total" />: {total.toLocaleString()}
        </span>
      </figcaption>

      <div dir="ltr" className="flex gap-2">
        {/* ציר Y */}
        <div className="flex flex-col justify-between h-36 text-[10px] text-ink-muted tabular-nums text-end w-7 shrink-0" aria-hidden>
          <span>{niceMax}</span>
          <span>{niceMax / 2}</span>
          <span>0</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative h-36 border-b border-base-border">
            {/* קווי עזר */}
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-base-border" aria-hidden />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-base-border" aria-hidden />
            <div className="absolute inset-0 flex items-end gap-[3px] sm:gap-1.5">
              {data.map((d) => {
                const pct = niceMax ? (d.value / niceMax) * 100 : 0;
                return (
                  <div key={d.day} className="group relative flex-1 min-w-0 h-full flex items-end justify-center">
                    <div
                      className={`w-full max-w-[22px] rounded-t ${bar} transition-[height] duration-500`}
                      style={{ height: `${pct}%`, minHeight: d.value ? 3 : 0 }}
                    />
                    {d.value > 0 && (
                      <span
                        className="absolute text-[9px] sm:text-[10px] font-semibold text-ink-secondary tabular-nums pointer-events-none"
                        style={{ bottom: `calc(${pct}% + 2px)` }}
                      >
                        {d.value}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-[3px] sm:gap-1.5 mt-1">
            {data.map((d, i) => (
              <span
                key={d.day}
                className={`flex-1 min-w-0 text-center text-[9px] sm:text-[10px] text-ink-muted tabular-nums ${
                  // במובייל: רק כל יום שני, והיום האחרון תמיד
                  i % 2 === (data.length - 1) % 2 ? "" : "invisible sm:visible"
                }`}
              >
                {fmtDay(d.day)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* גרסה נגישה לקוראי מסך */}
      <table className="sr-only">
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <th scope="row">{d.day}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function niceCeil(n: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const v = step * pow;
    // מספר זוגי כדי שחצי הסקאלה יהיה מספר שלם
    if (v >= n && Number.isInteger(v / 2)) return v;
  }
  return 10 * pow;
}
