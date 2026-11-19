"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProgressBar } from "@/components/ProgressBar";

type Props = {
  goalId: string;
  userId: string;
  currentProgress: number;
  goalTitle: string;
};

export function CheckinForm({
  goalId,
  userId,
  currentProgress,
  goalTitle,
}: Props) {
  const router = useRouter();
  const [progress, setProgress] = useState(currentProgress);
  const [note, setNote] = useState("");
  const [publishAchievement, setPublishAchievement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    try {
      const { error: checkinError } = await supabase.from("goal_checkins").insert({
        goal_id: goalId,
        user_id: userId,
        progress,
        note: note.trim() || null,
      });
      if (checkinError) throw checkinError;

      const status = progress >= 100 ? "completed" : "active";
      const goalUpdate: {
        progress: number;
        status: string;
        visibility?: "public_achievement";
      } = { progress, status };
      if (publishAchievement && progress >= 100) {
        goalUpdate.visibility = "public_achievement";
      }
      const { error: goalError } = await supabase
        .from("goals")
        .update(goalUpdate)
        .eq("id", goalId);
      if (goalError) throw goalError;

      if (publishAchievement && progress >= 100) {
        const { error: achievementError } = await supabase
          .from("achievements")
          .insert({
            goal_id: goalId,
            user_id: userId,
            title: goalTitle,
            message: note.trim() || "Objectif atteint !",
            progress,
            is_public: true,
          });
        if (achievementError) throw achievementError;
      }

      setMessage(
        progress >= 100
          ? "🎉 Objectif atteint, bravo ! Tu peux être fier·e de toi."
          : "Progression enregistrée.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de check-in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-panel space-y-4">
      <h2 className="font-display text-lg font-semibold text-brand-navy">
        Mettre à jour la progression
      </h2>
      <div>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted">Progression</span>
          <span className="font-semibold text-brand-navy">{progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="mb-2 w-full accent-brand-orange"
        />
        <ProgressBar value={progress} />
      </div>
      <div>
        <label className="label" htmlFor="note">
          Note
        </label>
        <textarea
          id="note"
          className="input min-h-20"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Qu'as-tu accompli ?"
        />
      </div>
      {progress >= 100 ? (
        <label className="flex items-center gap-2 text-sm text-brand-navy">
          <input
            type="checkbox"
            checked={publishAchievement}
            onChange={(e) => setPublishAchievement(e.target.checked)}
            className="accent-brand-orange"
          />
          Publier cette réussite sur le feed
        </label>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}