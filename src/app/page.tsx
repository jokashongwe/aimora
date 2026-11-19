import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,140,0,0.18),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(11,22,63,0.2),transparent_40%),linear-gradient(180deg,#f7f5f1_0%,#efeae2_100%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <Image
          src="/logo.png"
          alt="Aimora"
          width={140}
          height={42}
          className="h-9 w-auto"
          priority
        />
        <div className="flex gap-2">
          <Link href="/auth/login" className="btn-secondary !py-2">
            Connexion
          </Link>
          <Link href="/auth/signup" className="btn-primary !py-2">
            Commencer
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pb-16 pt-8">
        <p className="mb-4 max-w-xl font-display text-5xl font-semibold leading-tight tracking-tight text-brand-navy sm:text-6xl">
          Aimora
        </p>
        <h1 className="max-w-2xl text-xl font-medium text-brand-navy/90 sm:text-2xl">
          Suis tes objectifs. Reste motivé·e chaque matin. Partage tes réussites.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
          Organise tes objectifs par catégorie (Famille, Travail, Étude…),
          reçois des rappels motivationnels pour tes horizons hebdomadaires,
          mensuels et semestriels, et rends visibles tes progrès auprès de ceux
          qui comptent.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/signup" className="btn-primary">
            Créer mon compte
          </Link>
          <Link href="/auth/login" className="btn-secondary">
            J&apos;ai déjà un compte
          </Link>
        </div>
      </main>
    </div>
  );
}