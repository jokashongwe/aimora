import Link from "next/link";
import { GoalCard } from "@/components/GoalCard";
import { InstallPrompt } from "@/components/InstallPrompt";
import { createClient } from "@/lib/supabase/server";
import { computeStreak, daysUntil } from "@/lib/streak";
import { PERIOD_LABELS, type Goal, type GoalPeriod } from "@/lib/types";

export const metadata = { title: "Accueil" };

function greeting(timeZone: string) {
  let hour = 12;
  try {
    hour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "numeric",
        hour12: false,
      }).format(new Date()),
    );
  } catch {
    /* fuseau invalide : salutation neutre */
  }
  if (hour < 5 || hour >= 18) return "Bonsoir";
  if (hour < 12) return "Bonjour";
  return "Bon après-midi";
}

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function epochDay() {
  return Math.floor(Date.now() / 86_400_000);
}

function dueLabel(days: number) {
  if (days < 0) return `En retard de ${-days} j`;
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const since = daysAgoIso(120);

  const [
    { data: profile },
    { data: goals },
    { data: completed },
    { data: checkins },
    { data: messages },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, timezone, notifications_enabled")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("*, categories(*)")
      .eq("user_id", user!.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false }),
    supabase
      .from("goals")
      .select("*, categories(*)")
      .eq("user_id", user!.id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("goal_checkins")
      .select("created_at")
      .eq("user_id", user!.id)
      .gte("created_at", since),
    supabase
      .from("motivation_messages")
      .select("message")
      .eq("locale", "fr")
      .eq("period", "morning"),
  ]);

  const tz = profile?.timezone || "Africa/Kinshasa";
  const firstName = profile?.display_name?.trim().split(/\s+/)[0];
  const list = (goals ?? []) as Goal[];
  const done = (completed ?? []) as Goal[];
  const byPeriod = (period: GoalPeriod) =>
    list.filter((g) => g.period === period);

  const avgProgress =
    list.length > 0
      ? Math.round(list.reduce((sum, g) => sum + g.progress, 0) / list.length)
      : 0;

  const { streak, activeToday } = computeStreak(
    (checkins ?? []).map((c) => c.created_at as string),
    tz,
  );

  // Citation du jour : stable sur la journée, différente d'un jour à l'autre.
  const quotes = (messages ?? []).map((m) => m.message as string);
  const dayNumber = epochDay();
  const quote = quotes.length ? quotes[dayNumber % quotes.length] : null;

  const upcoming = list
    .filter((g) => g.end_date)
    .map((g) => ({ goal: g, days: daysUntil(g.end_date!, tz) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brand-navy">
            {greeting(tz)}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-muted">
            {list.length === 0
              ? "Prêt·e à te lancer ? Un premier objectif suffit pour commencer."
              : activeToday
                ? "Beau travail, tu as avancé aujourd'hui."
                : "Un pas aujourd'hui, une réussite demain."}
          </p>
        </div>
        <Link href="/goals/new" className="btn-primary">
          Nouvel objectif
        </Link>
      </div>

      {quote ? (
        <blockquote className="rounded-2xl bg-brand-navy px-5 py-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-gold">
            Ton élan du jour
          </p>
          <p className="mt-1 font-display text-lg leading-snug">{quote}</p>
        </blockquote>
      ) : null}

      <InstallPrompt />

      {profile && !profile.notifications_enabled ? (
        <aside className="card-panel flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-brand-navy">
            Reçois un rappel motivationnel chaque matin.
          </p>
          <Link href="/settings" className="btn-secondary">
            Activer les rappels
          </Link>
        </aside>
      ) : null}

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="card-panel !p-4">
          <p className="text-xs text-muted sm:text-sm">Objectifs actifs</p>
          <p className="mt-1 font-display text-3xl font-semibold text-brand-navy">
            {list.length}
          </p>
        </div>
        <div className="card-panel !p-4">
          <p className="text-xs text-muted sm:text-sm">Progression</p>
          <p className="mt-1 font-display text-3xl font-semibold text-brand-orange-text">
            {avgProgress}%
          </p>
        </div>
        <div className="card-panel !p-4">
          <p className="text-xs text-muted sm:text-sm">Série</p>
          <p className="mt-1 font-display text-3xl font-semibold text-brand-navy">
            {streak}
            <span className="ml-1 text-sm font-normal text-muted">
              {streak > 1 ? "jours" : "jour"}
            </span>
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card-panel space-y-3 text-center">
          <h2 className="font-display text-xl font-semibold text-brand-navy">
            Aucun objectif actif
          </h2>
          <p className="text-sm text-muted">
            Choisis une catégorie (Famille, Travail, Étude…), une période, et
            découpe ton objectif en petites étapes à cocher.
          </p>
          <Link href="/goals/new" className="btn-primary">
            Créer mon premier objectif
          </Link>
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-brand-navy">
            Prochaines échéances
          </h2>
          <ul className="space-y-2">
            {upcoming.map(({ goal, days }) => (
              <li key={goal.id}>
                <Link
                  href={`/goals/${goal.id}`}
                  className="card-panel flex min-h-11 items-center justify-between gap-3 !py-3"
                >
                  <span className="font-medium text-brand-navy">
                    {goal.title}
                  </span>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      days < 0 ? "text-red-700" : "text-brand-orange-text"
                    }`}
                  >
                    {dueLabel(days)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {list.length > 0
        ? (["weekly", "monthly", "semester"] as GoalPeriod[]).map((period) => {
            const items = byPeriod(period);
            return (
              <section key={period} className="space-y-3">
                <h2 className="font-display text-xl font-semibold text-brand-navy">
                  {PERIOD_LABELS[period]}
                </h2>
                {items.length === 0 ? (
                  <p className="text-sm text-muted">
                    Aucun objectif {PERIOD_LABELS[period].toLowerCase()}.{" "}
                    <Link
                      href="/goals/new"
                      className="font-semibold text-brand-orange-text"
                    >
                      En ajouter un
                    </Link>
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {items.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                )}
              </section>
            );
          })
        : null}

      {done.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-brand-navy">
            Réussites récentes
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {done.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
