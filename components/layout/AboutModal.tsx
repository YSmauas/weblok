"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/locale-provider";
import { IconClose, IconPuzzle, IconGithub } from "../ui/Icons";

type Tab = "about" | "privacy" | "accessibility";

const GITHUB_PROFILE = "https://github.com/YSmauas";
const GITHUB_PROJECT = "https://github.com/YSmauas/weblok";
const TOPMENTORS_PROFILE = "https://mitmachim.top/user/%D7%A0%D7%97%D7%9C%D7%A1-%D7%93%D7%95%D7%9F";

export function AboutModal({
  open,
  initialTab = "about",
  onClose,
}: {
  open: boolean;
  initialTab?: Tab;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>(initialTab);

  const TABS: { id: Tab; label: string }[] = [
    { id: "about", label: t("about.tabAbout") },
    { id: "privacy", label: t("about.tabPrivacy") },
    { id: "accessibility", label: t("about.tabAccessibility") },
  ];

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* תוקן הקונטרסט במצב בהיר על ידי הוספת bg-base-panel ושמירה על תכונות ה-glass */}
      <div className="relative w-full max-w-lg bg-base-panel glass rounded-card shadow-2xl border border-base-border">
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex gap-1 bg-base-bg/50 rounded-full p-1 border border-base-border">
            {TABS.map((tItem) => (
              <button
                key={tItem.id}
                onClick={() => setTab(tItem.id)}
                className={`text-sm px-4 py-1.5 rounded-full transition-colors ${
                  tab === tItem.id
                    ? "bg-accent text-base-bg font-semibold"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                {tItem.label}
              </button>
            ))}
          </div>
          <button onClick={onClose} aria-label="close" className="text-ink-muted hover:text-ink-primary transition-colors">
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 text-sm text-ink-secondary leading-relaxed max-h-[65vh] overflow-y-auto">
          {tab === "about" && (
            <div>
              <div className="flex flex-col items-center text-center gap-3 pb-6 mb-6 border-b border-base-border">
                <IconPuzzle className="w-12 h-12 text-accent drop-shadow-[0_0_12px_var(--accent)]" />
                <h3 className="text-xl font-extrabold text-ink-primary">
                  {t("about.creatorTitle")}
                </h3>
                <p className="text-xs text-ink-muted max-w-xs">
                  {t("about.creatorSubtitle")}
                </p>

                <a
                  href={GITHUB_PROJECT}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent hover:underline mt-2"
                >
                  {t("about.projectLink")}
                </a>

                <div className="mt-2">
                  <p className="text-[11px] text-ink-muted mb-2">{t("about.followMe")}</p>
                  <div className="flex items-center justify-center gap-3">
                    <a
                      href={GITHUB_PROFILE}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="GitHub"
                      className="w-8 h-8 rounded-full border border-base-border flex items-center justify-center hover:border-accent hover:text-accent transition-colors"
                    >
                      <IconGithub className="w-4 h-4" />
                    </a>
                    <a
                      href={TOPMENTORS_PROFILE}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Top Mentors"
                      className="w-8 h-8 rounded-full border border-base-border flex items-center justify-center overflow-hidden hover:border-accent transition-colors"
                    >
                      <Image src="/icons/topmentors.png" alt="Top Mentors" width={18} height={18} />
                    </a>
                  </div>
                </div>
              </div>

              <p>{t("about.body")}</p>
            </div>
          )}
          {tab === "privacy" && (
            <div className="space-y-4">
              <p>{t("about.privacy.intro")}</p>

              <h4 className="font-semibold text-ink-primary">{t("about.privacy.dataTitle")}</h4>
              <p>{t("about.privacy.dataBody")}</p>

              <h4 className="font-semibold text-ink-primary">{t("about.privacy.keysTitle")}</h4>
              <p>{t("about.privacy.keysBody")}</p>

              <h4 className="font-semibold text-ink-primary">{t("about.privacy.rlsTitle")}</h4>
              <p>{t("about.privacy.rlsBody")}</p>

              <h4 className="font-semibold text-ink-primary">{t("about.privacy.openSourceTitle")}</h4>
              <p>{t("about.privacy.openSourceBody")}</p>

              <p className="text-ink-muted text-xs pt-2 border-t border-base-border">
                {t("about.privacy.contact")}
              </p>
            </div>
          )}
          {tab === "accessibility" && (
            <div className="space-y-4">
              <p>{t("about.accessibility.intro")}</p>

              <h4 className="font-semibold text-ink-primary">{t("about.accessibility.levelTitle")}</h4>
              <p>{t("about.accessibility.levelBody")}</p>

              <h4 className="font-semibold text-ink-primary">{t("about.accessibility.adaptationsTitle")}</h4>
              <ul className="list-disc ps-5 space-y-1">
                <li>{t("about.accessibility.a1")}</li>
                <li>{t("about.accessibility.a2")}</li>
                <li>{t("about.accessibility.a3")}</li>
                <li>{t("about.accessibility.a4")}</li>
                <li>{t("about.accessibility.a5")}</li>
                <li>{t("about.accessibility.a6")}</li>
              </ul>

              <h4 className="font-semibold text-ink-primary">{t("about.accessibility.contactTitle")}</h4>
              <p>{t("about.accessibility.contactBody")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}