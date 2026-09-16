"use client";

import { IconGithub } from "../ui/Icons";

export function Footer({
  onOpenAbout,
}: {
  onOpenAbout: (tab: "privacy" | "accessibility") => void;
}) {
  return (
    <footer className="border-t border-base-border">
      <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-ink-muted flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span>נבנה ע״י</span>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="גיטהאב"
            className="hover:text-ink-primary transition-colors"
          >
            <IconGithub className="w-5 h-5" />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink-primary transition-colors underline underline-offset-2"
          >
            הפרופיל שלי
          </a>
        </div>

        <div className="flex gap-5">
          <button
            onClick={() => onOpenAbout("privacy")}
            className="hover:text-ink-secondary transition-colors"
          >
            פרטיות
          </button>
          <button
            onClick={() => onOpenAbout("accessibility")}
            className="hover:text-ink-secondary transition-colors"
          >
            נגישות
          </button>
        </div>
      </div>
    </footer>
  );
}
