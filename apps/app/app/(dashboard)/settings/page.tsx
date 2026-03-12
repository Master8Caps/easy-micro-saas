import { requireAuth } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="py-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-content-muted">
          Manage your account and preferences
        </p>

        <SettingsForm
          initialEmail={user.email ?? ""}
          initialFullName={profile?.full_name ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? null}
        />
      </div>
    </div>
  );
}
