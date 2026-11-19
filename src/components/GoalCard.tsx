import Link from "next/link";
import { ProgressBar } from "@/components/ProgressBar";
import { goalNextDue, dueLabel, formatShortDate } from "@/lib/todos";
import { PERIOD_LABELS, STATUS_LABELS, type Goal } from "@/lib/types";

export function GoalCard({
  goal,
  timeZone = "Africa/Kinshasa",
}: {
  goal: Goal;
  timeZone?: string;
}) {
  const todos = goal.goal_todos ?? [];
  const doneCount = todos.filter((t) => t.is_done).length;
  const due = goal.status === "active" ? goalNextDue(goal, timeZone) : null;

  return (
    <Link href={`/goals/${goal.id}`} className="card-panel block transition hover:-translate-y-0.5 hover:border-brand-orange/40">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-orange-text">
            {goal.categories?.name ?? "Catégorie"}
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold text-brand-navy">
            {goal.title}
          </h3>
        </div>
        <span className="rounded-full bg-brand-navy/5 px-2.5 py-1 text-xs font-medium text-brand-navy">
          {PERIOD_LABELS[goal.period]}
        </span>
      </div>
      {goal.description ? (
        <p className="mb-3 line-clamp-2 text-sm text-muted">{goal.description}</p>
      ) : null}
      {due ? (
        <p className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-brand-navy/5 px-3 py-2 text-sm">
          <span className="min-w-0 truncate text-brand-navy">
            <span className="text-muted">
              {due.fromTodo ? "Prochaine étape : " : "Échéance : "}
            </span>
            <span className="font-medium">{due.label}</span>
          </span>
          <span
            className={`shrink-0 text-xs font-semibold ${
              due.days < 0 ? "text-red-700" : "text-brand-orange-text"
            }`}
          >
            {dueLabel(due.days)} · {formatShortDate(due.date)}
          </span>
        </p>
      ) : null}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {STATUS_LABELS[goal.status]}
            {todos.length > 0 ? ` · ${doneCount}/${todos.length} étapes` : ""}
          </span>
          <span className="font-semibold text-brand-navy">{goal.progress}%</span>
        </div>
        <ProgressBar value={goal.progress} />
      </div>
    </Link>
  );
}
