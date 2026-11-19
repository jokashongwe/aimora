import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckinForm } from "@/components/CheckinForm";
import { GoalTodoList } from "@/components/GoalTodoList";
import { ProgressBar } from "@/components/ProgressBar";
import { groupCheckinsByDay } from "@/lib/checkins";
import { createClient } from "@/lib/supabase/server";
import {
  PERIOD_LABELS,
  STATUS_LABELS,
  type Goal,
  type GoalCheckin,
  type GoalTodo,
} from "@/lib/types";

export const metadata = { title: "Détail objectif" };

type Params = Promise<{ id: string }>;

export default async function GoalDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goal } = await supabase
    .from("goals")
    .select("*, categories(*)")
    .eq("id", id)
    .maybeSingle();

  if (!goal) notFound();

  const typed = goal as Goal;
  const isOwner = typed.user_id === user!.id;

  if (!isOwner && typed.visibility === "private") {
    const { data: share } = await supabase
      .from("goal_shares")
      .select("id")
      .eq("goal_id", id)
      .eq("shared_with_id", user!.id)
      .maybeSingle();
    if (!share) redirect("/goals");
  }

  const [{ data: todos }, { data: checkins }] = await Promise.all([
    supabase
      .from("goal_todos")
      .select("*")
      .eq("goal_id", id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("goal_checkins")
      .select("*")
      .eq("goal_id", id)
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user!.id)
    .maybeSingle();
  const tz = profile?.timezone || "Africa/Kinshasa";

  const todoList = (todos ?? []) as GoalTodo[];
  const hasTodos = todoList.length > 0;
  const history = groupCheckinsByDay((checkins ?? []) as GoalCheckin[], tz).slice(0, 14);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/goals" className="text-sm font-medium text-brand-orange-text">
          ← Objectifs
        </Link>
        {isOwner ? (
          <Link href={`/goals/${id}/edit`} className="btn-secondary !py-1.5">
            Modifier
          </Link>
        ) : null}
      </div>

      <div className="card-panel space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-orange-text">
            {typed.categories?.name}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-brand-navy">
            {typed.title}
          </h1>
          {typed.description ? (
            <p className="mt-2 text-muted">{typed.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-brand-navy/5 px-2.5 py-1 font-medium">
            {PERIOD_LABELS[typed.period]}
          </span>
          <span className="rounded-full bg-brand-navy/5 px-2.5 py-1 font-medium">
            {STATUS_LABELS[typed.status]}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted">
              Progression{hasTodos ? " (via les étapes)" : ""}
            </span>
            <span className="font-semibold">{typed.progress}%</span>
          </div>
          <ProgressBar value={typed.progress} />
        </div>
      </div>

      <GoalTodoList
        timeZone={tz}
        goalId={typed.id}
        userId={user!.id}
        goalTitle={typed.title}
        initialTodos={todoList}
        isOwner={isOwner}
      />

      {isOwner && !hasTodos ? (
        <CheckinForm
          goalId={typed.id}
          userId={user!.id}
          currentProgress={typed.progress}
          goalTitle={typed.title}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-brand-navy">
          Historique
        </h2>
        {history.length ? (
          <ul className="space-y-2">
            {history.map((d) => (
              <li key={d.day} className="card-panel !p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium capitalize text-brand-navy">
                    {d.label}
                  </span>
                  <span className="flex items-center gap-2">
                    {d.delta !== null && d.delta !== 0 ? (
                      <span
                        className={`text-xs font-semibold ${
                          d.delta > 0 ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {d.delta > 0 ? "+" : ""}
                        {d.delta} pts
                      </span>
                    ) : null}
                    <span className="font-semibold text-brand-navy">
                      {d.progress}%
                    </span>
                  </span>
                </div>
                {d.updates > 0 ? (
                  <p className="mt-1 text-xs text-muted">
                    {d.updates} mise{d.updates > 1 ? "s" : ""} à jour des étapes
                  </p>
                ) : null}
                {d.notes.map((n) => (
                  <p key={n.id} className="mt-1 text-muted">
                    <span className="text-xs">{n.time} · </span>
                    {n.text}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucun check-in pour le moment.</p>
        )}
      </section>
    </div>
  );
}