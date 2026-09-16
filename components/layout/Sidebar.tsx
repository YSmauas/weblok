"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChevronDown, IconClose } from "../ui/Icons";

// TODO: יוחלף בבדיקת session אמיתית מ-Auth.js (useSession) בהמשך
const isLoggedIn = false;
const isAdmin = false;

const BLOCKS_SUBMENU = [
  { slug: "chatbot-assistant", name: "העוזר החכם" },
];

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
        className={`fixed top-0 bottom-0 right-0 z-[56] w-[300px] glass border-l-0 border-base-border
          transition-transform duration-300 ease-out flex flex-col
          ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-base-border">
          <span className="font-extrabold text-lg">תפריט</span>
          <button
            onClick={onClose}
            aria-label="סגירת תפריט"
            className="text-ink-muted hover:text-ink-primary transition-colors"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
          <Link href="/" onClick={onClose} className="sidebar-link">
            בית
          </Link>
          <Link href="/auth/login" onClick={onClose} className="sidebar-link">
            התחברות / הרשמה
          </Link>

          <div>
            <button
              onClick={() => setBlocksExpanded((v) => !v)}
              className="sidebar-link w-full flex items-center justify-between"
            >
              בלוקים
              <IconChevronDown
                className={`w-4 h-4 transition-transform ${
                  blocksExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {blocksExpanded && (
              <div className="pr-4 border-r border-base-border mr-4 mt-1 mb-1 space-y-1">
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
                  כל הבלוקים
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenAbout("about")}
            className="sidebar-link w-full text-right"
          >
            עלינו
          </button>
          <button
            onClick={() => onOpenAbout("privacy")}
            className="sidebar-link w-full text-right"
          >
            פרטיות
          </button>
          <button
            onClick={() => onOpenAbout("accessibility")}
            className="sidebar-link w-full text-right"
          >
            נגישות
          </button>

          <div className="mt-4 pt-4 border-t border-base-border">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="block px-3 py-2.5 rounded-lg font-bold text-ink-primary hover:bg-base-panel2 transition-colors"
            >
              אזור אישי
            </Link>

            {isLoggedIn && (
              <div className="pr-4 border-r border-base-border mr-4 mt-1 space-y-1">
                <Link href="/dashboard/profile" onClick={onClose} className="submenu-link">
                  פרופיל
                </Link>
                <Link href="/dashboard/saved" onClick={onClose} className="submenu-link">
                  עיצובים שמורים
                </Link>
                <Link href="/dashboard/contact" onClick={onClose} className="submenu-link">
                  יצירת קשר
                </Link>
              </div>
            )}

            {isLoggedIn && isAdmin && (
              <Link href="/admin" onClick={onClose} className="sidebar-link">
                ניהול
              </Link>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
