import { daysUntil } from "@/lib/streak";
import type { GoalTodoSummary } from "@/lib/types";

/** Tri : échéance la plus proche d'abord, sans date à la fin, puis position. */
export function compareTodos(
  a: { due_date: string | null; position: number },
  b: { due_date: string | null; position: number },
) {
  if (a.due_date && b.due_date && a.due_date !== b.due_date) {
    return a.due_date < b.due_date ? -1 : 1;
  }
  if (a.due_date && !b.due_date) return -1;
  if (!a.due_date && b.due_date) return 1;
  return a.position - b.position;
}

/** Prochaine étape à faire : le todo non terminé le plus proche dans le temps. */
export function nextTodo<T extends GoalTodoSummary>(todos: T[] | null | undefined) {
  const pending = (todos ?? []).filter((t) => !t.is_done);
  pending.sort(compareTodos);
  return pending[0] ?? null;
}

export function dueLabel(days: number) {
  if (days < 0) return `En retard de ${-days} j`;
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}

export function formatShortDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Ajoute des mois à "AAAA-MM-JJ" en ramenant au dernier jour du mois si besoin (31 jan + 1 mois = 28/29 fév). */
export function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1, 12));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Prochaine échéance d'un objectif : celle de son prochain todo.
 * À défaut de todo daté, on retombe sur la date de fin de l'objectif.
 */
export function goalNextDue(
  goal: { title: string; end_date: string | null; goal_todos?: GoalTodoSummary[] | null },
  timeZone: string,
) {
  const todos = goal.goal_todos ?? [];
  const next = nextTodo(todos);

  if (next?.due_date) {
    return {
      label: next.title,
      date: next.due_date,
      days: daysUntil(next.due_date, timeZone),
      fromTodo: true,
    };
  }
  // Tous les todos sont faits : plus rien à échéancer.
  if (todos.length > 0 && !next) return null;

  if (goal.end_date) {
    return {
      label: next?.title ?? goal.title,
      date: goal.end_date,
      days: daysUntil(goal.end_date, timeZone),
      fromTodo: false,
    };
  }
  return null;
}
