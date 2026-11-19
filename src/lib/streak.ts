/** Date "AAAA-MM-JJ" d'un instant, dans le fuseau donné. */
export function dayKey(date: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function shiftDay(key: string, delta: number) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Série de jours consécutifs avec au moins une activité.
 * Si rien aujourd'hui, la série reste valide jusqu'à la fin de la journée
 * (elle compte à partir d'hier).
 */
export function computeStreak(
  activityDates: string[],
  timeZone: string,
  now = new Date(),
) {
  const days = new Set(activityDates.map((d) => dayKey(new Date(d), timeZone)));
  const today = dayKey(now, timeZone);
  const activeToday = days.has(today);
  let cursor = activeToday ? today : shiftDay(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return { streak, activeToday };
}

/** Jours restants jusqu'à une date "AAAA-MM-JJ" (négatif si dépassée). */
export function daysUntil(endDate: string, timeZone: string, now = new Date()) {
  const today = dayKey(now, timeZone);
  return Math.round(
    (new Date(`${endDate}T12:00:00Z`).getTime() -
      new Date(`${today}T12:00:00Z`).getTime()) /
      86_400_000,
  );
}
