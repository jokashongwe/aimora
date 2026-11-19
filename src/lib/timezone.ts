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