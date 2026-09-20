"use client";

import Image from "next/image";
import { useLocale } from "@/lib/i18n/locale-provider";
import { IconGithub } from "../ui/Icons";

const GITHUB_PROFILE = "https://github.com/YSmauas";
const TOPMENTORS_PROFILE = "https://mitmachim.top/user/%D7%A0%D7%97%D7%9C%D7%A1-%D7%93%D7%95%D7%9F";
const CLOUD_LINK = "https://claude.ai";

export function Footer({
  onOpenAbout,
}: {
  onOpenAbout: (tab: "privacy" | "accessibility") => void;
}) {
  const { t } = useLocale();

  return (
    <footer className="border-t border-base-border">
      <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-ink-muted flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span>
            {t("footer.creditPrefix")} {t("footer.creditName")}{" "}
            <span dir="ltr">
              {t("footer.creditTeam").replace("cloud", "")}
              <a
                href={CLOUD_LINK}
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink-secondary hover:underline"
              >
                cloud
              </a>
            </span>
          </span>

          <a
            href={GITHUB_PROFILE}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="hover:text-ink-primary transition-colors"
          >
            <IconGithub className="w-5 h-5" />
          </a>
          <a
            href={TOPMENTORS_PROFILE}
            target="_blank"
            rel="noreferrer"
            aria-label="Top Mentors"
            className="hover:opacity-80 transition-opacity"
          >
            <Image src="/icons/topmentors.png" alt="Top Mentors" width={20} height={20} className="rounded-full" />
          </a>
        </div>

        <div className="flex gap-5">
          <button onClick={() => onOpenAbout("privacy")} className="hover:text-ink-secondary transition-colors">
            {t("footer.privacy")}
          </button>
          <button onClick={() => onOpenAbout("accessibility")} className="hover:text-ink-secondary transition-colors">
            {t("footer.accessibility")}
          </button>
        </div>
      </div>
    </footer>
  );
}
