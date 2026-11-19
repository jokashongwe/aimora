import Link from "next/link";
import { ProgressBar } from "@/components/ProgressBar";
import { PERIOD_LABELS, STATUS_LABELS, type Goal } from "@/lib/types";

export function GoalCard({ goal }: { goal: Goal }) {
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
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{STATUS_LABELS[goal.status]}</span>
          <span className="font-semibold text-brand-navy">{goal.progress}%</span>
        </div>
        <ProgressBar value={goal.progress} />
      </div>
    </Link>
  );
}