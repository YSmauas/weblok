"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Reveal } from "@/components/ui/Reveal";

const ITEMS = [
  { href: "/blocks", icon: "🧩", title: "showcase.blocks.title", text: "showcase.blocks.text" },
  { href: "/tools/inject", icon: "💉", title: "showcase.inject.title", text: "showcase.inject.text" },
  { href: "/tools/github", icon: "🐙", title: "showcase.github.title", text: "showcase.github.text" },
];

/** שלושת הדברים העיקריים שאפשר לעשות באתר - כרטיסים שנחשפים בגלילה */
export function ToolsShowcase() {
  const { t } = useLocale();
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <Reveal>
        <h2 className="text-2xl md:text-3xl font-extrabold text-center">{t("showcase.title")}</h2>
      </Reveal>
      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {ITEMS.map((item, i) => (
          <Reveal key={item.href} delay={i * 110}>
            <Link
              href={item.href}
              className="group block h-full rounded-card border border-base-border bg-base-panel/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_18px_40px_-20px_var(--accent)]"
            >
              <span className="text-3xl inline-block transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" aria-hidden>
                {item.icon}
              </span>
              <h3 className="font-bold text-lg mt-3">{t(item.title)}</h3>
              <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed">{t(item.text)}</p>
              <span className="inline-block mt-4 text-sm text-accent">
                {t("blocks.open")} <span aria-hidden className="inline-block transition-transform group-hover:-translate-x-1 ltr:rotate-180 ltr:group-hover:translate-x-1">←</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
