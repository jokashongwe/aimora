import { ShareForm } from "@/components/ShareForm";
import { ProgressBar } from "@/components/ProgressBar";
import { createClient } from "@/lib/supabase/server";
import type { Achievement, Goal, GoalShare } from "@/lib/types";

export const metadata = { title: "Partage" };

export default async function SharePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myGoals } = await supabase
    .from("goals")
    .select("*, categories(*)")
    .eq("user_id", user!.id)
    .neq("status", "abandoned")
    .order("title");

  const { data: outgoing } = await supabase
    .from("goal_shares")
    .select("*, goals(*), shared_with:profiles!goal_shares_shared_with_id_fkey(display_name)")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: incoming } = await supabase
    .from("goal_shares")
    .select("*, goals(*, categories(*)), owner:profiles!goal_shares_owner_id_fkey(display_name)")
    .eq("shared_with_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: achievements } = await supabase
    .from("achievements")
    .select("*, profiles(display_name)")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-brand-navy">
          Partage & réussites
        </h1>
        <p className="mt-1 text-muted">
          Partage tes objectifs avec d&apos;autres utilisateurs et célèbre les
          réussites publiques.
        </p>
      </div>

      <ShareForm goals={(myGoals ?? []) as Goal[]} ownerId={user!.id} />

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-brand-navy">
          Objectifs que j&apos;ai partagés
        </h2>
        {(outgoing as GoalShare[] | null)?.length ? (
          <ul className="space-y-2">
            {(outgoing as Array<GoalShare & { shared_with?: { display_name: string } }>).map(
              (s) => (
                <li key={s.id} className="card-panel !py-3 text-sm">
                  <span className="font-medium text-brand-navy">
                    {s.goals?.title ?? "Objectif"}
                  </span>
                  <span className="text-muted">
                    {" "}
                    → {s.shared_with?.display_name ?? "Utilisateur"}
                  </span>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucun partage sortant.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-brand-navy">
          Objectifs partagés avec moi
        </h2>
        {(incoming as GoalShare[] | null)?.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(incoming as Array<GoalShare & { owner?: { display_name: string }; goals?: Goal }>).map(
              (s) => (
                <a
                  key={s.id}
                  href={`/goals/${s.goal_id}`}
                  className="card-panel block transition hover:border-brand-orange/40"
                >
                  <p className="text-xs text-brand-orange">
                    De {s.owner?.display_name ?? "Quelqu'un"}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-brand-navy">
                    {s.goals?.title}
                  </h3>
                  {s.goals ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs text-muted">
                        <span>{s.goals.categories?.name}</span>
                        <span>{s.goals.progress}%</span>
                      </div>
                      <ProgressBar value={s.goals.progress} />
                    </div>
                  ) : null}
                </a>
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">Rien de partagé avec toi pour l&apos;instant.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-brand-navy">
          Feed des réussites
        </h2>
        {(achievements as Achievement[] | null)?.length ? (
          <ul className="space-y-3">
            {(achievements as Achievement[]).map((a) => (
              <li key={a.id} className="card-panel">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-brand-orange">
                      {a.profiles?.display_name ?? "Quelqu'un"}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-brand-navy">
                      {a.title}
                    </h3>
                    {a.message ? (
                      <p className="mt-1 text-sm text-muted">{a.message}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-gradient-to-r from-brand-orange to-brand-gold px-2.5 py-1 text-xs font-semibold text-white">
                    {a.progress}%
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {new Date(a.created_at).toLocaleString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            Aucune réussite publique pour le moment. Atteins 100% et publie la tienne !
          </p>
        )}
      </section>
    </div>
  );
}