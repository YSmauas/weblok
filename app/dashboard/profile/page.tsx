import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { ApiKeysManager } from "@/components/dashboard/ApiKeysManager";
import { ProfileNameForm } from "@/components/dashboard/ProfileNameForm";
import { GithubConnect } from "@/components/dashboard/GithubConnect";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectedFrom=/dashboard/profile");

  const [{ data: profile }, { data: keys }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    // רק שמות הספקים - הערכים המוצפנים לא נשלפים לצד הלקוח בכלל.
    supabase.from("api_keys").select("provider").eq("user_id", user.id),
  ]);

  const githubConnected = !!user.identities?.some((i) => i.provider === "github");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold"><T k="profile.title" /></h1>
        <p className="text-ink-secondary mt-1"><T k="profile.subtitle" /></p>
      </div>

      <Card title={<T k="profile.detailsTitle" />}>
        <ProfileNameForm userId={user.id} name={profile?.name ?? ""} email={user.email ?? ""} />
      </Card>

      <Card title={<T k="profile.keysTitle" />} description={<T k="profile.keysDesc" />}>
        <ApiKeysManager configuredProviders={(keys ?? []).map((k) => k.provider)} />
      </Card>

      <Card title={<T k="profile.githubTitle" />} description={<T k="profile.githubDesc" />}>
        <GithubConnect connected={githubConnected} />
      </Card>
    </div>
  );
}
