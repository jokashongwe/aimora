import { addDays, addMonths } from "@/lib/todos";
import { dayKey } from "@/lib/streak";
import type { GoalPeriod } from "@/lib/types";

/** Date de fin suggérée : début + 1 semaine / 1 mois / 6 mois. */
export function endDateForPeriod(start: string, period: GoalPeriod) {
  switch (period) {
    case "weekly":
      return addDays(start, 7);
    case "monthly":
      return addMonths(start, 1);
    case "semester":
      return addMonths(start, 6);
  }
}

/** Date du jour "AAAA-MM-JJ" dans le fuseau de l'utilisateur. */
export function todayIn(timeZone: string) {
  return dayKey(new Date(), timeZone);
}
