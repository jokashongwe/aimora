import { dayKey } from "@/lib/streak";
import type { GoalCheckin } from "@/lib/types";

export type CheckinDay = {
  day: string; // AAAA-MM-JJ
  label: string;
  progress: number; // progression en fin de journée
  delta: number | null; // évolution par rapport à la veille (points)
  updates: number; // mises à jour automatiques (étapes cochées…) regroupées
  notes: { id: string; text: string; time: string }[]; // notes écrites par l'utilisateur
};

// Notes générées automatiquement par la liste d'étapes : on les regroupe au lieu de les lister.
const AUTO_NOTE =
  /^(\d+\/\d+ (étapes?|todos?) terminé(e)?s?|Étapes mises à jour|Todos mis à jour)$/i;

function dayLabel(day: string, today: string) {
  if (day === today) return "Aujourd'hui";
  const d = new Date(`${day}T12:00:00Z`);
  const prev = new Date(`${today}T12:00:00Z`);
  prev.setUTCDate(prev.getUTCDate() - 1);
  if (day === prev.toISOString().slice(0, 10)) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Regroupe les check-ins par jour (dans le fuseau de l'utilisateur) :
 * une ligne par jour avec la progression finale, l'évolution et les notes manuelles.
 * `checkins` doit être trié du plus récent au plus ancien.
 */
export function groupCheckinsByDay(
  checkins: GoalCheckin[],
  timeZone: string,
  now = new Date(),
): CheckinDay[] {
  const today = dayKey(now, timeZone);
  const byDay = new Map<string, GoalCheckin[]>();
  for (const c of checkins) {
    const key = dayKey(new Date(c.created_at), timeZone);
    byDay.set(key, [...(byDay.get(key) ?? []), c]);
  }

  const days = [...byDay.entries()]; // ordre d'insertion = du plus récent au plus ancien
  return days.map(([day, items], i) => {
    const latest = items[0];
    const previousDay = days[i + 1]?.[1][0];
    const notes = items
      .filter((c) => c.note && !AUTO_NOTE.test(c.note.trim()))
      .map((c) => ({
        id: c.id,
        text: c.note as string,
        time: new Date(c.created_at).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone,
        }),
      }));
    const updates = items.length - notes.length;
    return {
      day,
      label: dayLabel(day, today),
      progress: latest.progress,
      delta: previousDay ? latest.progress - previousDay.progress : null,
      updates,
      notes,
    };
  });
}
