"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({
  className = "btn-secondary",
  confirmFirst = false,
}: {
  className?: string;
  confirmFirst?: boolean;
}) {
  const router = useRouter();

  async function signOut() {
    if (confirmFirst && !window.confirm("Te déconnecter d'Aimora ?")) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} className={className}>
      Se déconnecter
    </button>
  );
}
