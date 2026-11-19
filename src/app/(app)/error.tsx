"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <div
      role="alert"
      className="card-panel mx-auto max-w-md space-y-4 text-center"
    >
      <h1 className="font-display text-2xl font-semibold text-brand-navy">
        {offline ? "Tu es hors ligne" : "Oups, un souci est survenu"}
      </h1>
      <p className="text-sm text-muted">
        {offline
          ? "Reconnecte-toi au réseau, puis réessaie."
          : "Ce n'est pas de ta faute. Réessaie, ou reviens à l'accueil."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className="btn-primary" onClick={() => retry()}>
          Réessayer
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Accueil
        </Link>
      </div>
    </div>
  );
}
