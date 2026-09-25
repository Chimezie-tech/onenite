import { NextResponse } from "next/server";
import { requireAdmin, getSupabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_EDIT_KEYS = ["first_name", "age", "city", "bio", "is_verified"];

export async function POST(req: Request) {
  const adminUser = await requireAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    userId?: string;
    action?: string;
    patch?: Record<string, unknown>;
  };
  if (!body.userId || !body.action) {
    return NextResponse.json({ error: "userId + action required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  switch (body.action) {
    case "suspend": {
      const endRaw = body.patch?.end as string | null | undefined;
      await admin.from("profiles")
        .update({ is_banned: true, suspended_until: endRaw ? new Date(endRaw).toISOString() : null })
        .eq("id", body.userId);
      break;
    }
    case "unsuspend":
      await admin.from("profiles").update({ is_banned: false, suspended_until: null }).eq("id", body.userId);
      break;
    case "activate": {
      const { data: p } = await admin.from("profiles").select("city").eq("id", body.userId).maybeSingle();
      if (!p?.city) return NextResponse.json({ error: "Set a city first (Edit → City)" }, { status: 400 });
      await admin.from("profiles").update({ onboarding_completed: true }).eq("id", body.userId);
      break;
    }
    case "upgrade": {
      const until = new Date(Date.now() + 30 * 86400000).toISOString();
      await admin.from("profiles").update({ is_premium: true, premium_expires_at: until }).eq("id", body.userId);
      break;
    }
    case "edit": {
      const patch: Record<string, unknown> = {};
      for (const key of ALLOWED_EDIT_KEYS) if (body.patch && key in body.patch) patch[key] = body.patch[key];
      if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
      await admin.from("profiles").update(patch).eq("id", body.userId);
      break;
    }
    case "delete":
      await admin.from("profiles").delete().eq("id", body.userId);
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}