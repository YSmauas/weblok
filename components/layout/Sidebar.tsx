"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useSession } from "@/lib/auth/use-session";
import { roleAtLeast } from "@/lib/auth/roles";
import { blocksRegistry } from "@/lib/blocks-registry";
import { IconChevronDown, IconClose } from "../ui/Icons";

/** כלים מתקדמים - כל כלי חדש נרשם כאן ומופיע אוטומטית בתפריט */
const TOOLS = [{ href: "/tools/inject", label: "sidebar.toolInject", icon: "💉" }];

/** פריט תפריט שנפתח לתת-רשימה (בלוקים / כלים מתקדמים) */
function Expandable({
  label,
  defaultOpen,
  children,
}: {
  label: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="sidebar-link w-full flex items-center justify-between"
      >
        {label}
        <IconChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="ps-4 border-s border-base-border ms-4 mt-1 mb-1 space-y-1">{children}</div>}
    </div>
  );
}

export function Sidebar({
  open,
  onClose,
  onOpenAbout,
}: {
  open: boolean;
  onClose: () => void;
  onOpenAbout: (tab: "about" | "privacy" | "accessibility") => void;
}) {
  const { t } = useLocale();
  const pathname = usePathname() ?? "";
  const { loggedIn: isLoggedIn, role, loading } = useSession();
  const isAdmin = roleAtLeast(role, "admin");

  // וילון סגור לא אמור להיות נגיש במקלדת/קורא מסך. React 18 לא מכיר את
  // המאפיין inert, לכן מציבים אותו ישירות על ה-DOM.
  const asideRef = useRef<HTMLElement>(null);
  useEffect(() => {
    asideRef.current?.toggleAttribute("inert", !open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const active = (href: string) => (pathname === href ? "text-accent font-semibold" : "");

  return (
    <>
      <button
        aria-hidden={!open}
        tabIndex={-1}
        onClick={onClose}
        className={`fixed inset-0 z-[55] bg-black/50 backdrop-blur-[2px] transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed top-0 bottom-0 end-0 z-[56] w-[300px] max-w-[85vw] glass
          transition-transform duration-300 ease-out flex flex-col
          ${open ? "translate-x-0" : "rtl:-translate-x-full ltr:translate-x-full"}`}
        aria-hidden={!open}
        aria-label={t("sidebar.title")}
        ref={asideRef}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-base-border">
          <span className="font-extrabold text-lg">{t("sidebar.title")}</span>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="text-ink-muted hover:text-ink-primary transition-colors"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
          <Link href="/" onClick={onClose} className={`sidebar-link ${active("/")}`}>
            {t("sidebar.home")}
          </Link>
          {loading ? null : isLoggedIn ? (
            <form action="/auth/signout" method="post">
              <button type="submit" className="sidebar-link w-full text-start">
                {t("sidebar.logout")}
              </button>
            </form>
          ) : (
            <Link href="/auth/login" onClick={onClose} className="sidebar-link">
              {t("sidebar.login")}
            </Link>
          )}

          <Expandable label={t("sidebar.blocks")} defaultOpen>
            {blocksRegistry.map((b) => (
              <Link key={b.slug} href={`/blocks/${b.slug}`} onClick={onClose} className={`submenu-link ${active(`/blocks/${b.slug}`)}`}>
                <span aria-hidden className="me-2">{b.icon}</span>
                {b.name}
              </Link>
            ))}
            <Link href="/blocks" onClick={onClose} className="block px-3 py-2 rounded-lg text-accent hover:underline">
              {t("sidebar.allBlocks")}
            </Link>
          </Expandable>

          <Expandable label={t("sidebar.tools")} defaultOpen={pathname.startsWith("/tools")}>
            {TOOLS.map((tool) => (
              <Link key={tool.href} href={tool.href} onClick={onClose} className={`submenu-link ${active(tool.href)}`}>
                <span aria-hidden className="me-2">{tool.icon}</span>
                {t(tool.label)}
              </Link>
            ))}
          </Expandable>

          <button onClick={() => onOpenAbout("about")} className="sidebar-link w-full text-start">
            {t("sidebar.aboutUs")}
          </button>
          <button onClick={() => onOpenAbout("privacy")} className="sidebar-link w-full text-start">
            {t("sidebar.privacy")}
          </button>
          <button onClick={() => onOpenAbout("accessibility")} className="sidebar-link w-full text-start">
            {t("sidebar.accessibility")}
          </button>

          {isLoggedIn && (
            <div className="mt-4 pt-4 border-t border-base-border">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="block px-3 py-2.5 rounded-lg font-bold text-ink-primary hover:bg-base-panel2 transition-colors"
              >
                {t("sidebar.personalArea")}
              </Link>

              <div className="ps-4 border-s border-base-border ms-4 mt-1 space-y-1">
                <Link href="/dashboard/profile" onClick={onClose} className="submenu-link">
                  {t("sidebar.profile")}
                </Link>
                <Link href="/dashboard/saved" onClick={onClose} className="submenu-link">
                  {t("sidebar.saved")}
                </Link>
                <Link href="/dashboard/projects" onClick={onClose} className="submenu-link">
                  {t("sidebar.projects")}
                </Link>
                <Link href="/dashboard/contact" onClick={onClose} className="submenu-link">
                  {t("sidebar.contact")}
                </Link>
              </div>

              {isAdmin && (
                <Link href="/admin" onClick={onClose} className="sidebar-link mt-2">
                  {t("sidebar.admin")}
                </Link>
              )}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
