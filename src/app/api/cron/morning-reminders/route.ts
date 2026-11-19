import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { configureWebPush, type PushPayload } from "@/lib/push";
import { isLocalHourInRange } from "@/lib/timezone";
import type { GoalPeriod } from "@/lib/types";

export const dynamic = "force-dynamic";

// Le cron tourne une fois par jour à 06:00 UTC (plan Hobby). On notifie tous les
// profils pour qui il est alors le matin (06h-10h locale) : Kinshasa 07h,
// Paris 07-08h, Nairobi 09h. Avec un cron horaire (plan Pro), réduire cette
// fenêtre à 1h pour éviter les doublons.
const REMINDER_WINDOW_START = 6;
const REMINDER_WINDOW_END = 10;

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
    .select("id, timezone, notifications_enabled, display_name")
    .eq("notifications_enabled", true);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const eligible = (profiles ?? []).filter((p) =>
    isLocalHourInRange(
      p.timezone || "Africa/Kinshasa",
      REMINDER_WINDOW_START,
      REMINDER_WINDOW_END,
    ),
  );

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
      continue;
    }

    const periods = new Set(goals.map((g) => g.period as GoalPeriod));
    let periodKey: "morning" | "weekly" | "monthly" | "semester" = "morning";
    if (periods.has("semester")) periodKey = "semester";
    else if (periods.has("monthly")) periodKey = "monthly";
    else if (periods.has("weekly")) periodKey = "weekly";

    const body = pickMessage([
      ...(byPeriod[periodKey] ?? []),
      ...(byPeriod.morning ?? []),
    ]);

    const payload: PushPayload = {
      title: "Airoma — rappel du matin",
      body,
      url: "/dashboard",
    };

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", profile.id);

    if (!subs?.length) {
      skipped += 1;
      continue;
    }

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
  }

  return NextResponse.json({
    ok: true,
    eligible: eligible.length,
    sent,
    skipped,
    errors: errors.slice(0, 10),
  });
}