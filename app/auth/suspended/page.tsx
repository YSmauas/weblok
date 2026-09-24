import { SiteChrome } from "@/components/layout/SiteChrome";
import { T } from "@/components/ui/T";

export default function SuspendedPage() {
  return (
    <SiteChrome>
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-danger"><T k="suspended.title" /></h1>
        <p className="text-ink-secondary mt-3"><T k="suspended.body" /></p>
      </div>
    </SiteChrome>
  );
}
