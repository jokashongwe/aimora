import Link from "next/link";
import { GoalCard } from "@/components/GoalCard";
import { createClient } from "@/lib/supabase/server";
import { PERIOD_LABELS, type Goal, type GoalPeriod } from "@/lib/types";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goals } = await supabase
    .from("goals")
    .select("*, categories(*)")
    .eq("user_id", user!.id)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  const list = (goals ?? []) as Goal[];
  const byPeriod = (period: GoalPeriod) =>
    list.filter((g) => g.period === period);

  const avgProgress =
    list.length > 0
      ? Math.round(list.reduce((sum, g) => sum + g.progress, 0) / list.length)
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brand-navy">
            Bonjour
          </h1>
          <p className="mt-1 text-muted">
            Voici tes objectifs actifs. Un pas aujourd&apos;hui, une réussite demain.
          </p>
        </div>
        <Link href="/goals/new" className="btn-primary">
          Nouvel objectif
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-panel">
          <p className="text-sm text-muted">Objectifs actifs</p>
          <p className="mt-1 font-display text-3xl font-semibold text-brand-navy">
            {list.length}
          </p>
        </div>
        <div className="card-panel">
          <p className="text-sm text-muted">Progression moyenne</p>
          <p className="mt-1 font-display text-3xl font-semibold text-brand-orange-text">
            {avgProgress}%
          </p>
        </div>
        <div className="card-panel">
          <p className="text-sm text-muted">Rappels</p>
          <p className="mt-1 text-sm text-brand-navy">
            Active les notifications dans{" "}
            <Link href="/settings" className="font-semibold text-brand-orange-text">
              Réglages
            </Link>
          </p>
        </div>
      </div>

      {(["weekly", "monthly", "semester"] as GoalPeriod[]).map((period) => {
        const items = byPeriod(period);
        return (
          <section key={period} className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-brand-navy">
              {PERIOD_LABELS[period]}
            </h2>
            {items.length === 0 ? (
              <p className="text-sm text-muted">Aucun objectif {PERIOD_LABELS[period].toLowerCase()}.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}