import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const trimmed = email.trim().toLowerCase();

  // Try display_name first via RLS client
  const { data: byName } = await supabase
    .from("profiles")
    .select("id")
    .ilike("display_name", trimmed)
    .maybeSingle();

  if (byName?.id) {
    return NextResponse.json({ userId: byName.id });
  }

  try {
    const admin = createAdminClient();
    const perPage = 200;
    let page = 1;

    while (page <= 5) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw error;

      const match = data.users.find(
        (u) => u.email?.toLowerCase() === trimmed,
      );
      if (match) {
        return NextResponse.json({ userId: match.id });
      }

      if (data.users.length < perPage) break;
      page += 1;
    }
  } catch {
    return NextResponse.json(
      {
        error:
          "Impossible de résoudre l'email. Vérifie SUPABASE_SERVICE_ROLE_KEY ou utilise le nom affiché.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
}