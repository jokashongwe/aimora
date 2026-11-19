import Link from "next/link";

export const metadata = { title: "Hors ligne" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl font-semibold text-brand-navy">
        Tu es hors ligne
      </h1>
      <p className="mt-2 text-muted">
        Airoma se reconnectera dès que le réseau sera disponible.
      </p>
      <Link href="/dashboard" className="btn-primary mt-6">
        Réessayer
      </Link>
    </div>
  );
}