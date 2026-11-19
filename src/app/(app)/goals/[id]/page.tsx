import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckinForm } from "@/components/CheckinForm";
import { GoalTodoList } from "@/components/GoalTodoList";
import { ProgressBar } from "@/components/ProgressBar";
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
      .limit(10),
  ]);

  const todoList = (todos ?? []) as GoalTodo[];
  const hasTodos = todoList.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/goals" className="text-sm font-medium text-brand-orange">
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
          <p className="text-xs font-medium uppercase tracking-wide text-brand-orange">
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
              Progression{hasTodos ? " (via todos)" : ""}
            </span>
            <span className="font-semibold">{typed.progress}%</span>
          </div>
          <ProgressBar value={typed.progress} />
        </div>
      </div>

      <GoalTodoList
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
        {(checkins as GoalCheckin[] | null)?.length ? (
          <ul className="space-y-2">
            {(checkins as GoalCheckin[]).map((c) => (
              <li key={c.id} className="card-panel !p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-brand-navy">
                    {c.progress}%
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(c.created_at).toLocaleString("fr-FR")}
                  </span>
                </div>
                {c.note ? <p className="mt-1 text-muted">{c.note}</p> : null}
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