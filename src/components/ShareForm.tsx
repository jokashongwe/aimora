"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Goal } from "@/lib/types";

export function ShareForm({
  goals,
  ownerId,
}: {
  goals: Goal[];
  ownerId: string;
}) {
  const router = useRouter();
  const [goalId, setGoalId] = useState(goals[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const supabase = createClient();

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name")
        .ilike("display_name", email.trim())
        .maybeSingle();

      // Fallback: look up by matching email via RPC-less approach —
      // profiles don't store email; we search display_name OR ask user for email
      // and resolve via auth admin is not available client-side.
      // So we also try exact id if UUID pasted.
      let sharedWithId = profile?.id;

      if (!sharedWithId) {
        const uuidLike =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            email.trim(),
          );
        if (uuidLike) {
          sharedWithId = email.trim();
        }
      }

      if (!sharedWithId) {
        // Try email match through a profiles view is unavailable; use API route
        const res = await fetch("/api/share/resolve-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Utilisateur introuvable");
        sharedWithId = json.userId;
      }

      if (!sharedWithId) throw new Error("Utilisateur introuvable");
      if (sharedWithId === ownerId) {
        throw new Error("Tu ne peux pas partager un objectif avec toi-même");
      }

      const { error: shareError } = await supabase.from("goal_shares").insert({
        goal_id: goalId,
        owner_id: ownerId,
        shared_with_id: sharedWithId,
        can_comment: true,
      });
      if (shareError) throw shareError;

      await supabase
        .from("goals")
        .update({ visibility: "shared" })
        .eq("id", goalId)
        .eq("user_id", ownerId);

      setSuccess("Objectif partagé avec succès.");
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de partage");
    } finally {
      setLoading(false);
    }
  }

  if (!goals.length) {
    return (
      <p className="text-sm text-muted">
        Crée d&apos;abord un objectif pour pouvoir le partager.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-panel space-y-4">
      <h2 className="font-display text-lg font-semibold text-brand-navy">
        Partager un objectif
      </h2>
      <div>
        <label className="label" htmlFor="goal">
          Objectif
        </label>
        <select
          id="goal"
          className="input"
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
        >
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email ou nom affiché du destinataire
        </label>
        <input
          id="email"
          className="input"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ami@exemple.com ou Nom"
        />
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Partage…" : "Partager"}
      </button>
    </form>
  );
}