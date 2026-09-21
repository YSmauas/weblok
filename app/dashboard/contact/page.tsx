import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { ContactForm } from "@/components/contact/ContactForm";
import { getSession } from "@/lib/auth/session";

export default async function DashboardContactPage() {
  const session = await getSession();

  return (
    <div>
      <h1 className="text-2xl font-bold"><T k="dcontact.title" /></h1>
      <p className="text-ink-secondary mt-1"><T k="dcontact.subtitle" /></p>

      <Card className="mt-6">
        <ContactForm prefill={{ name: session?.name || session?.email || "", email: session?.email ?? "" }} />
      </Card>
    </div>
  );
}
