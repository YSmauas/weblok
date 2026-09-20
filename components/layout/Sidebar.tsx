"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { IconChevronDown, IconClose } from "../ui/Icons";

// TODO: יוחלף בבדיקת session/role אמיתית (ראו lib/auth/session.ts)
const isLoggedIn = false;
const isAdmin = false;

const BLOCKS_SUBMENU = [{ slug: "chatbot-assistant", name: "העוזר החכם" }];

export function Sidebar({
  open,
  onClose,
  onOpenAbout,
}: {
  open: boolean;
  onClose: () => void;
  onOpenAbout: (tab: "about" | "privacy" | "accessibility") => void;
}) {
  const [blocksExpanded, setBlocksExpanded] = useState(false);
  const { t } = useLocale();

  return (
    <>
      <button
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-[55] bg-black/50 backdrop-blur-[2px] transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed top-0 bottom-0 end-0 z-[56] w-[300px] glass
          transition-transform duration-300 ease-out flex flex-col
          ${open ? "translate-x-0" : "rtl:-translate-x-full ltr:translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-base-border">
          <span className="font-extrabold text-lg">{t("sidebar.title")}</span>
          <button
            onClick={onClose}
            aria-label={t("header.menu")}
            className="text-ink-muted hover:text-ink-primary transition-colors"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
          <Link href="/" onClick={onClose} className="sidebar-link">
            {t("sidebar.home")}
          </Link>
          <Link href="/auth/login" onClick={onClose} className="sidebar-link">
            {t("sidebar.login")}
          </Link>

          <div>
            <button
              onClick={() => setBlocksExpanded((v) => !v)}
              className="sidebar-link w-full flex items-center justify-between"
            >
              {t("sidebar.blocks")}
              <IconChevronDown
                className={`w-4 h-4 transition-transform ${blocksExpanded ? "rotate-180" : ""}`}
              />
            </button>
            {blocksExpanded && (
              <div className="ps-4 border-s border-base-border ms-4 mt-1 mb-1 space-y-1">
                {BLOCKS_SUBMENU.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/blocks/${b.slug}`}
                    onClick={onClose}
                    className="block px-3 py-2 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-base-panel2 transition-colors"
                  >
                    {b.name}
                  </Link>
                ))}
                <Link
                  href="/blocks"
                  onClick={onClose}
                  className="block px-3 py-2 rounded-lg text-accent hover:underline"
                >
                  {t("sidebar.allBlocks")}
                </Link>
              </div>
            )}
          </div>

          <button onClick={() => onOpenAbout("about")} className="sidebar-link w-full text-start">
            {t("sidebar.aboutUs")}
          </button>
          <button onClick={() => onOpenAbout("privacy")} className="sidebar-link w-full text-start">
            {t("sidebar.privacy")}
          </button>
          <button
            onClick={() => onOpenAbout("accessibility")}
            className="sidebar-link w-full text-start"
          >
            {t("sidebar.accessibility")}
          </button>

          <div className="mt-4 pt-4 border-t border-base-border">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="block px-3 py-2.5 rounded-lg font-bold text-ink-primary hover:bg-base-panel2 transition-colors"
            >
              {t("sidebar.personalArea")}
            </Link>

            {isLoggedIn && (
              <div className="ps-4 border-s border-base-border ms-4 mt-1 space-y-1">
                <Link href="/dashboard/profile" onClick={onClose} className="submenu-link">
                  {t("sidebar.profile")}
                </Link>
                <Link href="/dashboard/saved" onClick={onClose} className="submenu-link">
                  {t("sidebar.saved")}
                </Link>
                <Link href="/dashboard/contact" onClick={onClose} className="submenu-link">
                  {t("sidebar.contact")}
                </Link>
              </div>
            )}

            {isLoggedIn && isAdmin && (
              <Link href="/admin" onClick={onClose} className="sidebar-link">
                {t("sidebar.admin")}
              </Link>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
