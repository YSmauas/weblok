import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { getSession } from "@/lib/auth/session";
import { Greeting } from "@/components/dashboard/Greeting";

const QUICK_LINKS = [
  { href: "/dashboard/profile", k: "dash.l.profile" },
  { href: "/dashboard/saved", k: "dash.l.saved" },
  { href: "/dashboard/projects", k: "dash.l.projects" },
  { href: "/dashboard/contact", k: "dash.l.contact" },
];

export default async function DashboardOverviewPage() {
  const session = await getSession();
  const name = session?.name?.split("@")[0] || "";

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {name ? <Greeting name={name} /> : <T k="dash.title" />}
      </h1>
      <p className="text-ink-secondary mt-1"><T k="dash.welcome" /></p>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {QUICK_LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="hover:border-accent/60 transition-colors h-full">
              <h3 className="font-semibold"><T k={`${l.k}.title`} /></h3>
              <p className="text-sm text-ink-secondary mt-1"><T k={`${l.k}.desc`} /></p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
