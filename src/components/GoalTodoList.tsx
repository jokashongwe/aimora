"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { GoalTodo } from "@/lib/types";

type Props = {
  goalId: string;
  userId: string;
  goalTitle: string;
  initialTodos: GoalTodo[];
  isOwner: boolean;
};

export function GoalTodoList({
  goalId,
  userId,
  goalTitle,
  initialTodos,
  isOwner,
}: Props) {
  const router = useRouter();
  const [todos, setTodos] = useState(initialTodos);

  useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos]);
  const [title, setTitle] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishOnComplete, setPublishOnComplete] = useState(false);

  const doneCount = useMemo(
    () => todos.filter((t) => t.is_done).length,
    [todos],
  );
  const progress =
    todos.length === 0 ? 0 : Math.round((doneCount / todos.length) * 100);

  async function afterTodoChange(nextTodos: GoalTodo[]) {
    const supabase = createClient();
    const nextDone = nextTodos.filter((t) => t.is_done).length;
    const nextProgress =
      nextTodos.length === 0
        ? 0
        : Math.round((nextDone / nextTodos.length) * 100);

    await supabase.from("goal_checkins").insert({
      goal_id: goalId,
      user_id: userId,
      progress: nextProgress,
      note:
        nextTodos.length === 0
          ? "Todos mis à jour"
          : `${nextDone}/${nextTodos.length} todos terminés`,
    });

    if (nextProgress >= 100 && publishOnComplete) {
      await supabase.from("goals").update({ visibility: "public_achievement" }).eq("id", goalId);
      await supabase.from("achievements").insert({
        goal_id: goalId,
        user_id: userId,
        title: goalTitle,
        message: "Tous les todos sont terminés !",
        progress: 100,
        is_public: true,
      });
    }

    router.refresh();
  }

  async function addTodo(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    setError(null);
    const supabase = createClient();

    const { data, error: insertError } = await supabase
      .from("goal_todos")
      .insert({
        goal_id: goalId,
        user_id: userId,
        title: title.trim(),
        position: todos.length,
      })
      .select("*")
      .single();

    setAdding(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    const next = [...todos, data as GoalTodo];
    setTodos(next);
    setTitle("");
    await afterTodoChange(next);
  }

  async function toggleTodo(todo: GoalTodo) {
    setLoadingId(todo.id);
    setError(null);
    const supabase = createClient();
    const nextDone = !todo.is_done;

    const { error: updateError } = await supabase
      .from("goal_todos")
      .update({ is_done: nextDone })
      .eq("id", todo.id);

    setLoadingId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    const next = todos.map((t) =>
      t.id === todo.id ? { ...t, is_done: nextDone } : t,
    );
    setTodos(next);
    await afterTodoChange(next);
  }

  async function deleteTodo(todoId: string) {
    setLoadingId(todoId);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("goal_todos")
      .delete()
      .eq("id", todoId);

    setLoadingId(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const next = todos.filter((t) => t.id !== todoId);
    setTodos(next);
    await afterTodoChange(next);
  }

  return (
    <section className="card-panel space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-brand-navy">
            Todos
          </h2>
          <p className="text-sm text-muted">
            Coche chaque étape : la progression de l&apos;objectif se met à jour
            automatiquement.
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-brand-orange">
          {doneCount}/{todos.length || 0} · {progress}%
        </span>
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-muted">
          Aucun todo pour le moment. Ajoute les étapes de ton objectif.
        </p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded-xl border border-border/80 bg-background/60 px-3 py-2.5"
            >
              <input
                type="checkbox"
                checked={todo.is_done}
                disabled={!isOwner || loadingId === todo.id}
                onChange={() => toggleTodo(todo)}
                className="h-4 w-4 accent-brand-orange"
                aria-label={`Marquer « ${todo.title} »`}
              />
              <span
                className={`flex-1 text-sm ${
                  todo.is_done
                    ? "text-muted line-through"
                    : "font-medium text-brand-navy"
                }`}
              >
                {todo.title}
              </span>
              {isOwner ? (
                <button
                  type="button"
                  className="text-xs text-muted hover:text-red-600"
                  disabled={loadingId === todo.id}
                  onClick={() => deleteTodo(todo.id)}
                >
                  Supprimer
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {isOwner ? (
        <>
          <form onSubmit={addTodo} className="flex gap-2">
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nouvelle étape…"
              required
            />
            <button type="submit" className="btn-primary shrink-0" disabled={adding}>
              {adding ? "…" : "Ajouter"}
            </button>
          </form>

          <label className="flex items-center gap-2 text-sm text-brand-navy">
            <input
              type="checkbox"
              checked={publishOnComplete}
              onChange={(e) => setPublishOnComplete(e.target.checked)}
              className="accent-brand-orange"
            />
            Publier la réussite quand tous les todos sont cochés
          </label>
        </>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
    </section>
  );
}