"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { todayIn } from "@/lib/periods";
import { daysUntil } from "@/lib/streak";
import {
  addDays,
  addMonths,
  compareTodos,
  dueLabel,
  formatShortDate,
} from "@/lib/todos";
import type { GoalTodo } from "@/lib/types";

type Props = {
  goalId: string;
  userId: string;
  goalTitle: string;
  initialTodos: GoalTodo[];
  isOwner: boolean;
  timeZone: string;
};

type Repeat = "none" | "weekly" | "monthly";

// Les étapes passées sortent du calcul (numérateur et dénominateur).
function counted(todos: GoalTodo[]) {
  return todos.filter((t) => !t.is_skipped);
}

function percent(todos: GoalTodo[]) {
  const active = counted(todos);
  if (active.length === 0) return 0;
  return Math.round(
    (active.filter((t) => t.is_done).length / active.length) * 100,
  );
}

export function GoalTodoList({
  goalId,
  userId,
  goalTitle,
  initialTodos,
  isOwner,
  timeZone,
}: Props) {
  const router = useRouter();
  const [todos, setTodos] = useState(initialTodos);

  // Resynchronise avec les données du serveur après un router.refresh()
  // (ajustement d'état pendant le rendu, recommandé par React à la place d'un effet).
  const [serverTodos, setServerTodos] = useState(initialTodos);
  if (initialTodos !== serverTodos) {
    setServerTodos(initialTodos);
    setTodos(initialTodos);
  }
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [repeat, setRepeat] = useState<Repeat>("none");
  const [count, setCount] = useState(6);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishOnComplete, setPublishOnComplete] = useState(false);
  const [postponeId, setPostponeId] = useState<string | null>(null);

  const sorted = useMemo(() => [...todos].sort(compareTodos), [todos]);
  const nextId = sorted.find((t) => !t.is_done && !t.is_skipped)?.id;
  const activeTodos = counted(todos);
  const doneCount = activeTodos.filter((t) => t.is_done).length;
  const skippedCount = todos.length - activeTodos.length;
  const progress = percent(todos);

  async function afterTodoChange(previousProgress: number, nextTodos: GoalTodo[]) {
    const supabase = createClient();
    const nextProgress = percent(nextTodos);
    const activeNext = counted(nextTodos);
    const nextDone = activeNext.filter((t) => t.is_done).length;

    await supabase.from("goal_checkins").insert({
      goal_id: goalId,
      user_id: userId,
      progress: nextProgress,
      note:
        activeNext.length === 0
          ? "Étapes mises à jour"
          : `${nextDone}/${activeNext.length} étapes terminées`,
    });

    // On ne publie qu'au moment où l'objectif passe à 100 % (pas à chaque coche).
    if (nextProgress >= 100 && previousProgress < 100 && publishOnComplete) {
      await supabase
        .from("goals")
        .update({ visibility: "public_achievement" })
        .eq("id", goalId);
      await supabase.from("achievements").insert({
        goal_id: goalId,
        user_id: userId,
        title: goalTitle,
        message: "Toutes les étapes sont terminées !",
        progress: 100,
        is_public: true,
      });
    }

    router.refresh();
  }

  async function addTodo(e: FormEvent) {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    if (repeat !== "none" && !dueDate) {
      setError("Choisis la date de la première occurrence pour répéter l'étape.");
      return;
    }

    const occurrences = repeat === "none" ? 1 : Math.min(Math.max(count, 2), 24);
    const basePosition =
      todos.reduce((max, t) => Math.max(max, t.position), -1) + 1;
    const rows = Array.from({ length: occurrences }, (_, i) => ({
      goal_id: goalId,
      user_id: userId,
      title: cleanTitle,
      position: basePosition + i,
      due_date: dueDate
        ? repeat === "monthly"
          ? addMonths(dueDate, i)
          : repeat === "weekly"
            ? addDays(dueDate, 7 * i)
            : dueDate
        : null,
    }));

    setAdding(true);
    setError(null);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("goal_todos")
      .insert(rows)
      .select("*");
    setAdding(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    const previous = percent(todos);
    const next = [...todos, ...((data ?? []) as GoalTodo[])];
    setTodos(next);
    setTitle("");
    setDueDate("");
    setRepeat("none");
    await afterTodoChange(previous, next);
  }

  async function toggleTodo(todo: GoalTodo) {
    setLoadingId(todo.id);
    setError(null);
    const supabase = createClient();
    const nextDone = !todo.is_done;

    const { error: updateError } = await supabase
      .from("goal_todos")
      .update({ is_done: nextDone, is_skipped: false })
      .eq("id", todo.id);

    setLoadingId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    const previous = percent(todos);
    const next = todos.map((t) =>
      t.id === todo.id ? { ...t, is_done: nextDone, is_skipped: false } : t,
    );
    setTodos(next);
    await afterTodoChange(previous, next);
  }

  // Passer une étape (ex. dîner manqué ce mois-ci) : elle n'est plus comptée
  // dans la progression. Réversible avec « Rétablir ».
  async function skipTodo(todo: GoalTodo, skip: boolean) {
    setLoadingId(todo.id);
    setError(null);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("goal_todos")
      .update({ is_skipped: skip, is_done: false })
      .eq("id", todo.id);

    setLoadingId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    const previous = percent(todos);
    const next = todos.map((t) =>
      t.id === todo.id ? { ...t, is_skipped: skip, is_done: false } : t,
    );
    setTodos(next);
    await afterTodoChange(previous, next);
  }

  async function changeDueDate(todo: GoalTodo, value: string) {
    setLoadingId(todo.id);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("goal_todos")
      .update({ due_date: value || null })
      .eq("id", todo.id);
    setLoadingId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setTodos(
      todos.map((t) => (t.id === todo.id ? { ...t, due_date: value || null } : t)),
    );
    router.refresh();
  }

  // Reporter : décale l'échéance. Le décalage part de l'échéance actuelle, ou
  // d'aujourd'hui si l'étape est déjà en retard / sans date.
  function postponeOptions(todo: GoalTodo) {
    const today = todayIn(timeZone);
    const base = todo.due_date && todo.due_date >= today ? todo.due_date : today;
    return [
      { label: "Demain", date: addDays(today, 1) },
      { label: "+ 1 semaine", date: addDays(base, 7) },
      { label: "+ 1 mois", date: addMonths(base, 1) },
    ].filter((o) => !todo.due_date || o.date > todo.due_date);
  }

  async function postponeTodo(todo: GoalTodo, date: string) {
    await changeDueDate(todo, date);
    setPostponeId(null);
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

    const previous = percent(todos);
    const next = todos.filter((t) => t.id !== todoId);
    setTodos(next);
    await afterTodoChange(previous, next);
  }

  return (
    <section className="card-panel space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-brand-navy">
            Étapes
          </h2>
          <p className="text-sm text-muted">
            Donne une date à chaque étape et coche-les : la progression se met
            à jour automatiquement.
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-brand-orange-text">
          {doneCount}/{activeTodos.length} · {progress}%
          {skippedCount > 0 ? (
            <span className="block text-right text-xs font-normal text-muted">
              {skippedCount} passée{skippedCount > 1 ? "s" : ""}
            </span>
          ) : null}
        </span>
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune étape pour le moment. Ajoute les étapes de ton objectif, avec
          leur date.
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((todo) => {
            const days = todo.due_date ? daysUntil(todo.due_date, timeZone) : null;
            const skipped = todo.is_skipped;
            const overdue =
              days !== null && days < 0 && !todo.is_done && !skipped;
            const isNext = todo.id === nextId;
            return (
              <li
                key={todo.id}
                className={`flex flex-wrap items-center gap-x-1 rounded-xl border bg-background/60 pl-1 pr-2 ${
                  isNext ? "border-brand-orange/60" : "border-border/80"
                }`}
              >
                <label className="flex min-h-11 min-w-0 flex-1 basis-48 cursor-pointer items-center gap-3 px-2">
                  <input
                    type="checkbox"
                    checked={todo.is_done}
                    disabled={!isOwner || skipped || loadingId === todo.id}
                    onChange={() => toggleTodo(todo)}
                    className="h-6 w-6 shrink-0 accent-brand-orange"
                    aria-label={`Marquer « ${todo.title} »`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-base sm:text-sm ${
                        todo.is_done || skipped
                          ? "text-muted line-through"
                          : "font-medium text-brand-navy"
                      }`}
                    >
                      {todo.title}
                    </span>
                    {skipped ? (
                      <span className="block text-xs italic text-muted">
                        Passée{todo.due_date ? ` · ${formatShortDate(todo.due_date)}` : ""}
                      </span>
                    ) : null}
                    {todo.due_date && !skipped ? (
                      <span
                        className={`block text-xs ${
                          overdue
                            ? "font-semibold text-red-700"
                            : isNext
                              ? "font-semibold text-brand-orange-text"
                              : "text-muted"
                        }`}
                      >
                        {todo.is_done
                          ? formatShortDate(todo.due_date)
                          : `${dueLabel(days!)} · ${formatShortDate(todo.due_date)}`}
                        {isNext && !todo.is_done ? " · prochaine étape" : ""}
                      </span>
                    ) : null}
                  </span>
                </label>
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      className="min-h-11 px-2 text-sm font-medium text-brand-navy underline-offset-2 hover:underline"
                      disabled={loadingId === todo.id}
                      onClick={() => skipTodo(todo, !skipped)}
                      aria-label={`${skipped ? "Rétablir" : "Passer"} l'étape « ${todo.title} »`}
                    >
                      {skipped ? "Rétablir" : "Passer"}
                    </button>
                    {!todo.is_done && !skipped ? (
                      <button
                        type="button"
                        className="min-h-11 px-2 text-sm font-medium text-brand-navy underline-offset-2 hover:underline"
                        disabled={loadingId === todo.id}
                        aria-expanded={postponeId === todo.id}
                        onClick={() =>
                          setPostponeId(postponeId === todo.id ? null : todo.id)
                        }
                        aria-label={`Reporter l'étape « ${todo.title} »`}
                      >
                        Reporter
                      </button>
                    ) : null}
                    <input
                      type="date"
                      value={todo.due_date ?? ""}
                      disabled={loadingId === todo.id}
                      onChange={(e) => changeDueDate(todo, e.target.value)}
                      aria-label={`Échéance de « ${todo.title} »`}
                      className="input !w-auto min-h-11 !px-2 !py-1 !text-sm"
                    />
                    <button
                      type="button"
                      className="min-h-11 px-2 text-sm text-muted hover:text-red-600"
                      disabled={loadingId === todo.id}
                      onClick={() => {
                        if (window.confirm(`Supprimer « ${todo.title} » ?`)) {
                          deleteTodo(todo.id);
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  </>
                ) : null}
                {isOwner && postponeId === todo.id ? (
                  <div className="flex basis-full flex-wrap items-center gap-2 border-t border-border/60 px-2 py-2">
                    <span className="text-xs text-muted">Reporter à :</span>
                    {postponeOptions(todo).map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        disabled={loadingId === todo.id}
                        onClick={() => postponeTodo(todo, o.date)}
                        className="btn-secondary !min-h-11 !px-3 !py-1.5 !text-sm"
                      >
                        {o.label}
                        <span className="ml-1.5 text-xs font-normal text-muted">
                          {formatShortDate(o.date)}
                        </span>
                      </button>
                    ))}
                    <span className="text-xs text-muted">
                      ou choisis une date ci-dessus.
                    </span>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {isOwner ? (
        <>
          <form onSubmit={addTodo} className="space-y-3 border-t border-border/70 pt-4">
            <div>
              <label className="label" htmlFor="todo-title">
                Nouvelle étape
              </label>
              <input
                id="todo-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Dîner avec ma famille"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="todo-date">
                  Date{repeat !== "none" ? " de la 1re fois" : " (optionnel)"}
                </label>
                <input
                  id="todo-date"
                  type="date"
                  className="input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required={repeat !== "none"}
                />
              </div>
              <div>
                <label className="label" htmlFor="todo-repeat">
                  Répéter
                </label>
                <select
                  id="todo-repeat"
                  className="input"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value as Repeat)}
                >
                  <option value="none">Une seule fois</option>
                  <option value="monthly">Chaque mois</option>
                  <option value="weekly">Chaque semaine</option>
                </select>
              </div>
              {repeat !== "none" ? (
                <div>
                  <label className="label" htmlFor="todo-count">
                    Nombre de fois
                  </label>
                  <input
                    id="todo-count"
                    type="number"
                    inputMode="numeric"
                    min={2}
                    max={24}
                    className="input"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </div>
              ) : null}
            </div>
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding
                ? "Ajout…"
                : repeat === "none"
                  ? "Ajouter l'étape"
                  : `Ajouter ${Math.min(Math.max(count, 2), 24)} étapes`}
            </button>
          </form>

          <label className="flex min-h-11 items-center gap-2 text-sm text-brand-navy">
            <input
              type="checkbox"
              checked={publishOnComplete}
              onChange={(e) => setPublishOnComplete(e.target.checked)}
              className="h-5 w-5 accent-brand-orange"
            />
            Publier la réussite quand toutes les étapes sont cochées
          </label>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
