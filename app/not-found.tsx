import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { T } from "@/components/ui/T";

export default function NotFound() {
  return (
    <SiteChrome>
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <p className="text-6xl font-extrabold text-accent">404</p>
        <h1 className="text-2xl font-bold mt-4"><T k="notFound.title" /></h1>
        <p className="text-ink-secondary mt-2"><T k="notFound.body" /></p>
        <Link
          href="/"
          className="inline-block mt-8 bg-accent text-base-bg font-semibold rounded-full px-6 py-2.5 text-sm hover:bg-accent-hover transition-colors"
        >
          <T k="notFound.home" />
        </Link>
      </div>
    </SiteChrome>
  );
}
