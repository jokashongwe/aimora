import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Inscription" };

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex justify-center">
        <Image src="/logo.png" alt="Airoma" width={140} height={42} className="h-9 w-auto" />
      </Link>
      <AuthForm mode="signup" />
    </div>
  );
}