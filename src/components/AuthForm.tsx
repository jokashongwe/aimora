"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-panel mx-auto w-full max-w-md space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-navy">
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "login"
            ? "Retrouve tes objectifs et ta progression."
            : "Rejoins Aimora et commence à suivre tes objectifs."}
        </p>
      </div>

      {mode === "signup" ? (
        <div>
          <label className="label" htmlFor="displayName">
            Nom affiché
          </label>
          <input
            id="displayName"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ton prénom"
          />
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="toi@exemple.com"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading
          ? "Chargement…"
          : mode === "login"
            ? "Se connecter"
            : "S'inscrire"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link href="/auth/signup" className="font-semibold text-brand-orange-text">
              S&apos;inscrire
            </Link>
          </>
        ) : (
          <>
            Déjà inscrit·e ?{" "}
            <Link href="/auth/login" className="font-semibold text-brand-orange-text">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </form>
  );
}