"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { AboutModal } from "./AboutModal";

type AboutTab = "about" | "privacy" | "accessibility";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aboutTab, setAboutTab] = useState<AboutTab | null>(null);

  const openAbout = (tab: AboutTab) => {
    setSidebarOpen(false);
    setAboutTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onOpenAbout={() => openAbout("about")}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAbout={openAbout}
      />

      <AboutModal
        open={aboutTab !== null}
        initialTab={aboutTab ?? "about"}
        onClose={() => setAboutTab(null)}
      />

      <main className="flex-1">{children}</main>

      <Footer onOpenAbout={openAbout} />
    </div>
  );
}
