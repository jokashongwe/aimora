import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Connexion" };

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next, error } = await searchParams;
  const initialError =
    error === "auth"
      ? "Le lien de confirmation est invalide ou a expiré. Connecte-toi, ou demande un nouveau lien."
      : error === "expired"
        ? "Le lien de réinitialisation a expiré. Demande-en un nouveau."
        : undefined;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex justify-center">
        <Image src="/logo.png" alt="Aimora" width={140} height={42} className="h-9 w-auto" />
      </Link>
      <AuthForm mode="login" next={next} initialError={initialError} />
    </div>
  );
}
