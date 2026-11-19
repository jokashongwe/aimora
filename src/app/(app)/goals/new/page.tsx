import Link from "next/link";
import { GoalForm } from "@/components/GoalForm";
import { createClient } from "@/lib/supabase/server";
import { todayIn } from "@/lib/periods";
import type { Category } from "@/lib/types";

export const metadata = { title: "Nouvel objectif" };

export default async function NewGoalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(`is_system.eq.true,user_id.eq.${user!.id}`)
    .order("name");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user!.id)
    .maybeSingle();
  const today = todayIn(profile?.timezone || "Africa/Kinshasa");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/goals" className="text-sm font-medium text-brand-orange-text">
        ← Retour
      </Link>
      <h1 className="font-display text-3xl font-semibold text-brand-navy">
        Nouvel objectif
      </h1>
      <GoalForm
        categories={(categories ?? []) as Category[]}
        userId={user!.id}
        today={today}
      />
    </div>
  );
}