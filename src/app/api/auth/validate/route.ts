import type { TelegramUser } from "@/types";
import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import { generateReferralCode } from "@/lib/supabase/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  if (
    !process.env.TELEGRAM_BOT_TOKEN ||
    !process.env.SUPABASE_JWT_SECRET ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Server misconfigured: missing environment variables on Vercel" },
      { status: 500 }
    );
  }

  try {
    const { initData } = await req.json();
    if (!initData) return NextResponse.json({ error: "No initData" }, { status: 400 });

    // 1. VERIFY TELEGRAM HASH
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return NextResponse.json({ error: "Missing hash" }, { status: 400 });

    const checkString = Array.from(params.entries())
      .filter(([key]) => key !== "hash")
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(process.env.TELEGRAM_BOT_TOKEN!)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(checkString)
      .digest("hex");

    if (calculatedHash !== hash) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. EXTRACT USER DATA
    const userString = params.get("user");
    if (!userString) return NextResponse.json({ error: "No user data" }, { status: 400 });

    const tgUser = JSON.parse(userString) as TelegramUser;
    const telegramId = tgUser.id;
    const firstName = tgUser.first_name || "User";
    const username = tgUser.username || null;
    const photoUrl = tgUser.photo_url || null;

    // 3. CHECK FOR REFERRAL CODE
    const startParam = params.get("start_param");
    let referredBy: string | null = null;
    if (startParam?.startsWith("ref_")) {
      const code = startParam.substring(4);
      const { data: referrer } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("referral_code", code)
        .maybeSingle();
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    // 4. CHECK IF USER EXISTS
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    // 5. UPSERT PROFILE
    const payload: Record<string, unknown> = {
      telegram_id: telegramId,
      first_name: firstName,
      username: username,
      photo_url: photoUrl,
      last_active_at: new Date().toISOString(),
      referral_code: existingProfile?.referral_code || generateReferralCode(),
    };

    // Only set referred_by for brand new users
    if (!existingProfile && referredBy) {
      payload.referred_by = referredBy;
    }

    const { data: profile, error: dbError } = await supabaseAdmin
      .from("profiles")
      .upsert(payload, { onConflict: "telegram_id" })
      .select()
      .single();

    if (dbError || !profile) {
      console.error("DB Error:", dbError);
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }

    // 6. MINT SUPABASE JWT
    const jwtPayload = {
      sub: profile.id,
      role: "authenticated",
      iss: "supabase",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    };

    const token = jwt.sign(jwtPayload, process.env.SUPABASE_JWT_SECRET!);

    return NextResponse.json({ token, profile });
  } catch (error) {
    console.error("Auth validation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}