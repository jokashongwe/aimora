"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { frenchAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({
      password,
    });
    setLoading(false);
    if (updateError) {
      setError(frenchAuthError(updateError));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card-panel mx-auto w-full max-w-md space-y-4"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-navy">
          Nouveau mot de passe
        </h1>
        <p className="mt-1 text-sm text-muted">
          Choisis-en un d&apos;au moins 8 caractères.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="password">
          Nouveau mot de passe
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
