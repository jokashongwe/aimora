import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Nouveau mot de passe" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Le lien reçu par e-mail ouvre une session ; sans session, lien expiré.
  if (!user) redirect("/auth/login?error=expired");

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex justify-center">
        <Image src="/logo.png" alt="Aimora" width={140} height={42} className="h-9 w-auto" />
      </Link>
      <ResetPasswordForm />
    </div>
  );
}
