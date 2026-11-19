"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const TIMEZONES = [
  "Africa/Kinshasa",
  "Africa/Lubumbashi",
  "Africa/Nairobi",
  "Europe/Paris",
  "Europe/Brussels",
  "UTC",
];

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        timezone,
      })
      .eq("id", profile.id);

    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Profil mis à jour.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card-panel space-y-4">
      <h2 className="font-display text-lg font-semibold text-brand-navy">
        Profil
      </h2>
      <div>
        <label className="label" htmlFor="displayName">
          Nom affiché
        </label>
        <input
          id="displayName"
          className="input"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="timezone">
          Fuseau horaire (rappel chaque matin, vers 7h-9h)
        </label>
        <select
          id="timezone"
          className="input"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>
      {message ? <p className="text-sm text-brand-navy">{message}</p> : null}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}