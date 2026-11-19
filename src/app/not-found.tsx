import Link from "next/link";

export const metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-6xl font-semibold text-brand-orange-text">
        404
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-brand-navy">
        Page introuvable
      </h1>
      <p className="mt-2 text-muted">
        Cet objectif ou cette page n&apos;existe pas, ou ne t&apos;est pas
        accessible.
      </p>
      <Link href="/dashboard" className="btn-primary mt-6">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
