import type { TelegramUser } from "@/types";

import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase with the MASTER KEY (service_role). 
// Only the server can use this. It bypasses RLS.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { initData } = await req.json();
    if (!initData) return NextResponse.json({ error: "No initData" }, { status: 400 });

    // 1. VERIFY TELEGRAM HASH
    // Telegram sends data as a URL-encoded string. We must parse and verify it.
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return NextResponse.json({ error: "Missing hash" }, { status: 400 });

    // Create the data-check-string (alphabetical order, separated by \n)
    const checkString = Array.from(params.entries())
      .filter(([key]) => key !== "hash")
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join("\n");

    // Secret key is HMAC-SHA256 of "WebAppData" + Bot Token
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

    // 3. UPSERT PROFILE (Create if new, update name/photo if returning)
    const { data: profile, error: dbError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          telegram_id: telegramId,
          first_name: firstName,
          username: username,
          photo_url: photoUrl,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: "telegram_id" }
      )
      .select()
      .single();

    if (dbError || !profile) {
      console.error("DB Error:", dbError);
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }

    // 4. MINT SUPABASE JWT
    // We sign a token that tells Supabase: "This user is authenticated, and their ID is X"
    const payload = {
      sub: profile.id,            // The user's UUID (this becomes auth.uid() in SQL!)
      role: "authenticated",      // Required by Supabase RLS
      iss: "supabase",            // Issuer
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    };

    const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET!);

    // 5. RETURN TOKEN & PROFILE TO FRONTEND
    return NextResponse.json({ token, profile });

  } catch (error) {
    console.error("Auth validation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}