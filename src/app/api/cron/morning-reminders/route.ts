import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { configureWebPush, type PushPayload } from "@/lib/push";
import { daysUntil } from "@/lib/streak";
import { dueLabel } from "@/lib/todos";
import { localNow } from "@/lib/timezone";
import type { GoalPeriod } from "@/lib/types";

export const dynamic = "force-dynamic";

// Cette route doit être appelée toutes les heures. Chaque utilisateur reçoit son
// rappel à l'heure locale qu'il a choisie (profiles.reminder_hour, 7h par défaut).
// Si une exécution est manquée, on rattrape pendant GRACE_HOURS heures.
// last_reminder_on garantit un seul rappel par jour et par utilisateur.
const DEFAULT_REMINDER_HOUR = 7;
const GRACE_HOURS = 3;

function pickMessage(messages: string[]) {
  if (!messages.length) {
    return "Bonjour ! Un petit pas vers tes objectifs aujourd'hui.";
  }
  return messages[Math.floor(Math.random() * messages.length)];
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const admin = createAdminClient();
  const webpush = configureWebPush();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, timezone, notifications_enabled, display_name, reminder_hour, last_reminder_on")
    .eq("notifications_enabled", true);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const eligible = (profiles ?? []).filter((p) => {
    const { hour, date } = localNow(p.timezone || "Africa/Kinshasa");
    const target = p.reminder_hour ?? DEFAULT_REMINDER_HOUR;
    return (
      hour >= target && hour < target + GRACE_HOURS && p.last_reminder_on !== date
    );
  });

  async function markDone(p: { id: string; timezone: string | null }) {
    await admin
      .from("profiles")
      .update({ last_reminder_on: localNow(p.timezone || "Africa/Kinshasa").date })
      .eq("id", p.id);
  }

  const { data: motivation } = await admin
    .from("motivation_messages")
    .select("period, message")
    .eq("locale", "fr");

  const byPeriod: Record<string, string[]> = {};
  for (const row of motivation ?? []) {
    byPeriod[row.period] = byPeriod[row.period] ?? [];
    byPeriod[row.period].push(row.message);
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const profile of eligible) {
    const { data: goals } = await admin
      .from("goals")
      .select("period")
      .eq("user_id", profile.id)
      .eq("status", "active");

    if (!goals?.length) {
      skipped += 1;
      await markDone(profile);
      continue;
    }

    const periods = new Set(goals.map((g) => g.period as GoalPeriod));
    let periodKey: "morning" | "weekly" | "monthly" | "semester" = "morning";
    if (periods.has("semester")) periodKey = "semester";
    else if (periods.has("monthly")) periodKey = "monthly";
    else if (periods.has("weekly")) periodKey = "weekly";

    const motivation = pickMessage([
      ...(byPeriod[periodKey] ?? []),
      ...(byPeriod.morning ?? []),
    ]);

    // Prochaine étape à faire (en retard ou dans les 7 jours) : on la met en avant.
    const profileTz = profile.timezone || "Africa/Kinshasa";
    const { data: nextTodos } = await admin
      .from("goal_todos")
      .select("title, due_date, goals!inner(status)")
      .eq("user_id", profile.id)
      .eq("is_done", false)
      .eq("is_skipped", false)
      .eq("goals.status", "active")
      .not("due_date", "is", null)
      .order("due_date", { ascending: true })
      .limit(1);
    const nextTodo = nextTodos?.[0];
    const nextDays = nextTodo
      ? daysUntil(nextTodo.due_date as string, profileTz)
      : null;
    const body =
      nextTodo && nextDays !== null && nextDays <= 7
        ? `${dueLabel(nextDays)} : ${nextTodo.title}. ${motivation}`
        : motivation;

    const payload: PushPayload = {
      title:
        (profile.reminder_hour ?? DEFAULT_REMINDER_HOUR) < 12
          ? "Aimora — rappel du matin"
          : "Aimora — ton rappel du jour",
      body,
      url: "/dashboard",
    };

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", profile.id);

    if (!subs?.length) {
      skipped += 1;
      await markDone(profile);
      continue;
    }

    let delivered = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
        sent += 1;
        delivered += 1;
      } catch (err) {
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? Number((err as { statusCode: number }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
        errors.push(
          err instanceof Error ? err.message : `Push failed for ${sub.endpoint}`,
        );
      }
    }
    // Si rien n'a pu être livré, on retentera à la prochaine exécution (dans la période de rattrapage).
    if (delivered > 0) await markDone(profile);
  }

  return NextResponse.json({
    ok: true,
    eligible: eligible.length,
    sent,
    skipped,
    errors: errors.slice(0, 10),
  });
}