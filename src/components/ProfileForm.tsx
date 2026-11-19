"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { localNow } from "@/lib/timezone";
import type { Profile } from "@/lib/types";

const TIMEZONES = [
  "Africa/Kinshasa",
  "Africa/Lubumbashi",
  "Africa/Nairobi",
  "Europe/Paris",
  "Europe/Brussels",
  "UTC",
];

const REMINDER_HOURS = Array.from({ length: 17 }, (_, i) => i + 5); // 05:00 → 21:00
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [reminderHour, setReminderHour] = useState(profile.reminder_hour ?? 7);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    // Si l'heure choisie est déjà passée aujourd'hui, le prochain rappel est pour
    // demain (sinon le rattrapage l'enverrait immédiatement).
    const now = localNow(timezone);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        timezone,
        reminder_hour: reminderHour,
        last_reminder_on: now.hour >= reminderHour ? now.date : null,
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
          Fuseau horaire
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
      <div>
        <label className="label" htmlFor="reminderHour">
          Heure du rappel
        </label>
        <select
          id="reminderHour"
          className="input"
          value={reminderHour}
          onChange={(e) => setReminderHour(Number(e.target.value))}
        >
          {(REMINDER_HOURS.includes(reminderHour)
            ? REMINDER_HOURS
            : [...REMINDER_HOURS, reminderHour].sort((a, b) => a - b)
          ).map((h) => (
            <option key={h} value={h}>
              {hourLabel(h)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted">
          Tu recevras ton rappel à cette heure, dans le fuseau choisi ci-dessus
          (à quelques minutes près).
        </p>
      </div>
      {message ? (
        <p role="status" className="text-sm text-brand-navy">
          {message}
        </p>
      ) : null}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}