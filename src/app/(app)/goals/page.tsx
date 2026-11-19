import Link from "next/link";
import { GoalCard } from "@/components/GoalCard";
import { createClient } from "@/lib/supabase/server";
import type { Category, Goal, GoalPeriod } from "@/lib/types";
import { PERIOD_LABELS } from "@/lib/types";

export const metadata = { title: "Objectifs" };

type SearchParams = Promise<{ category?: string; period?: string }>;

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(`is_system.eq.true,user_id.eq.${user!.id}`)
    .order("name");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user!.id)
    .maybeSingle();
  const tz = profile?.timezone || "Africa/Kinshasa";

  let query = supabase
    .from("goals")
    .select("*, categories(*), goal_todos(id, title, is_done, is_skipped, due_date, position)")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  if (params.category) {
    query = query.eq("category_id", params.category);
  }
  if (params.period && ["weekly", "monthly", "semester"].includes(params.period)) {
    query = query.eq("period", params.period);
  }

  const { data: goals } = await query;
  const list = (goals ?? []) as Goal[];
  const cats = (categories ?? []) as Category[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brand-navy">
            Mes objectifs
          </h1>
          <p className="mt-1 text-muted">Filtre par catégorie ou période.</p>
        </div>
        <Link href="/goals/new" className="btn-primary">
          Nouvel objectif
        </Link>
      </div>

      <form className="card-panel flex flex-wrap gap-3">
        <div className="min-w-[160px] flex-1">
          <label className="label" htmlFor="category">
            Catégorie
          </label>
          <select
            id="category"
            name="category"
            className="input"
            defaultValue={params.category ?? ""}
          >
            <option value="">Toutes</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="label" htmlFor="period">
            Période
          </label>
          <select
            id="period"
            name="period"
            className="input"
            defaultValue={params.period ?? ""}
          >
            <option value="">Toutes</option>
            {(Object.keys(PERIOD_LABELS) as GoalPeriod[]).map((key) => (
              <option key={key} value={key}>
                {PERIOD_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-secondary">
            Filtrer
          </button>
        </div>
      </form>

      {list.length === 0 ? (
        <p className="text-sm text-muted">
          Aucun objectif pour ces filtres.{" "}
          <Link href="/goals/new" className="font-semibold text-brand-orange-text">
            Créer un objectif
          </Link>
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((goal) => (
            <GoalCard key={goal.id} goal={goal} timeZone={tz} />
          ))}
        </div>
      )}
    </div>
  );
}