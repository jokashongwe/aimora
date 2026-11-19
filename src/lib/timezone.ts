/** Returns true if local hour in timezone is within [startHour, endHour). */
export function isLocalHourInRange(
  timezone: string,
  startHour: number,
  endHour: number,
  now = new Date(),
) {
  try {
    const hourStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(now);
    const hour = Number(hourStr);
    return hour >= startHour && hour < endHour;
  } catch {
    return false;
  }
}

/** Heure (0-23) et date "AAAA-MM-JJ" locales dans un fuseau donné. */
export function localNow(timezone: string, now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return {
      hour: Number(get("hour")),
      date: `${get("year")}-${get("month")}-${get("day")}`,
    };
  } catch {
    return { hour: now.getUTCHours(), date: now.toISOString().slice(0, 10) };
  }
}
