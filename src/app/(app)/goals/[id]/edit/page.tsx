import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GoalForm } from "@/components/GoalForm";
import { createClient } from "@/lib/supabase/server";
import type { Category, Goal } from "@/lib/types";

export const metadata = { title: "Modifier l'objectif" };

type Params = Promise<{ id: string }>;

export default async function EditGoalPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!goal) notFound();
  if ((goal as Goal).user_id !== user!.id) redirect("/goals");

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(`is_system.eq.true,user_id.eq.${user!.id}`)
    .order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/goals/${id}`} className="text-sm font-medium text-brand-orange">
        ← Retour
      </Link>
      <h1 className="font-display text-3xl font-semibold text-brand-navy">
        Modifier l&apos;objectif
      </h1>
      <GoalForm
        categories={(categories ?? []) as Category[]}
        goal={goal as Goal}
        userId={user!.id}
      />
    </div>
  );
}