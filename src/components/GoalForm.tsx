"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Category, Goal, GoalPeriod, GoalVisibility } from "@/lib/types";
import { PERIOD_LABELS } from "@/lib/types";

type Props = {
  categories: Category[];
  goal?: Goal;
  userId: string;
};

export function GoalForm({ categories, goal, userId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [categoryId, setCategoryId] = useState(
    goal?.category_id ?? categories[0]?.id ?? "",
  );
  const [period, setPeriod] = useState<GoalPeriod>(goal?.period ?? "weekly");
  const [visibility, setVisibility] = useState<GoalVisibility>(
    goal?.visibility ?? "private",
  );
  const [endDate, setEndDate] = useState(goal?.end_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId,
      period,
      visibility,
      end_date: endDate || null,
      user_id: userId,
    };

    try {
      if (goal) {
        const { error: updateError } = await supabase
          .from("goals")
          .update(payload)
          .eq("id", goal.id);
        if (updateError) throw updateError;
        router.push(`/goals/${goal.id}`);
      } else {
        const { data, error: insertError } = await supabase
          .from("goals")
          .insert(payload)
          .select("id")
          .single();
        if (insertError) throw insertError;
        router.push(`/goals/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-panel space-y-4">
      <div>
        <label className="label" htmlFor="title">
          Titre
        </label>
        <input
          id="title"
          className="input"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Lire 2 livres ce mois-ci"
        />
      </div>

      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className="input min-h-24"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Précise ton intention…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">
            Catégorie
          </label>
          <select
            id="category"
            className="input"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="period">
            Période
          </label>
          <select
            id="period"
            className="input"
            value={period}
            onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
          >
            {(Object.keys(PERIOD_LABELS) as GoalPeriod[]).map((key) => (
              <option key={key} value={key}>
                {PERIOD_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="visibility">
            Visibilité
          </label>
          <select
            id="visibility"
            className="input"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as GoalVisibility)}
          >
            <option value="private">Privé</option>
            <option value="shared">Partageable</option>
            <option value="public_achievement">Réussite publique</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="endDate">
            Date de fin (optionnel)
          </label>
          <input
            id="endDate"
            type="date"
            className="input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Enregistrement…" : goal ? "Mettre à jour" : "Créer l'objectif"}
      </button>
    </form>
  );
}