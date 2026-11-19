import { NotificationToggle } from "@/components/NotificationToggle";
import { ProfileForm } from "@/components/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Réglages" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-brand-navy">
          Réglages
        </h1>
        <p className="mt-1 text-muted">
          Profil, fuseau horaire et notifications push.
        </p>
      </div>

      {profile ? <ProfileForm profile={profile as Profile} /> : null}

      <div className="card-panel space-y-3">
        <h2 className="font-display text-lg font-semibold text-brand-navy">
          Notifications
        </h2>
        <NotificationToggle
          enabled={(profile as Profile | null)?.notifications_enabled ?? false}
          userId={user!.id}
        />
      </div>
    </div>
  );
}