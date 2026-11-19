"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { frenchAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot";

function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";
}

export function AuthForm({
  mode,
  next,
  initialError,
}: {
  mode: Mode;
  next?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<{
    email: string;
    kind: "confirm" | "reset";
  } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() || email.split("@")[0] },
            emailRedirectTo: `${origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          // Confirmation par e-mail activée : pas encore connecté.
          setSentTo({ email, kind: "confirm" });
          return;
        }
      } else if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          { redirectTo: `${origin}/auth/callback?next=/reset-password` },
        );
        if (resetError) throw resetError;
        setSentTo({ email, kind: "reset" });
        return;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push(safeNext(next));
      router.refresh();
    } catch (err) {
      setError(frenchAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div
        role="status"
        className="card-panel mx-auto w-full max-w-md space-y-4 text-center"
      >
        <h1 className="font-display text-2xl font-semibold text-brand-navy">
          Vérifie ta boîte mail
        </h1>
        <p className="text-sm text-muted">
          {sentTo.kind === "confirm"
            ? "Nous avons envoyé un lien de confirmation à "
            : "Si un compte existe pour "}
          <strong className="text-brand-navy">{sentTo.email}</strong>
          {sentTo.kind === "confirm"
            ? ". Ouvre-le pour activer ton compte, puis reviens te connecter."
            : ", un lien pour choisir un nouveau mot de passe vient d'être envoyé."}
        </p>
        <p className="text-xs text-muted">
          Pense à regarder dans les courriers indésirables.
        </p>
        <Link href="/auth/login" className="btn-primary w-full">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  const titles: Record<Mode, string> = {
    login: "Connexion",
    signup: "Créer un compte",
    forgot: "Mot de passe oublié",
  };
  const subtitles: Record<Mode, string> = {
    login: "Retrouve tes objectifs et ta progression.",
    signup: "Rejoins Aimora et commence à suivre tes objectifs.",
    forgot: "Indique ton e-mail, nous t'envoyons un lien pour le réinitialiser.",
  };

  return (
    <form
      onSubmit={onSubmit}
      className="card-panel mx-auto w-full max-w-md space-y-4"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-navy">
          {titles[mode]}
        </h1>
        <p className="mt-1 text-sm text-muted">{subtitles[mode]}</p>
      </div>

      {mode === "signup" ? (
        <div>
          <label className="label" htmlFor="displayName">
            Nom affiché
          </label>
          <input
            id="displayName"
            className="input"
            autoComplete="given-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ton prénom"
          />
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="toi@exemple.com"
        />
      </div>

      {mode !== "forgot" ? (
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label className="label !mb-0" htmlFor="password">
              Mot de passe
            </label>
            {mode === "login" ? (
              <Link
                href="/auth/forgot"
                className="text-sm font-medium text-brand-orange-text"
              >
                Mot de passe oublié ?
              </Link>
            ) : null}
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "signup" ? (
            <p className="mt-1 text-xs text-muted">8 caractères minimum.</p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading
          ? "Chargement…"
          : mode === "login"
            ? "Se connecter"
            : mode === "signup"
              ? "S'inscrire"
              : "Envoyer le lien"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link
              href="/auth/signup"
              className="font-semibold text-brand-orange-text"
            >
              S&apos;inscrire
            </Link>
          </>
        ) : (
          <>
            {mode === "signup" ? "Déjà inscrit·e ? " : "Tu t'en souviens ? "}
            <Link
              href="/auth/login"
              className="font-semibold text-brand-orange-text"
            >
              Se connecter
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
