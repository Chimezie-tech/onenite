import { NextResponse } from "next/server";
import { requireUser, getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram/bot";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, message } = (await req.json()) as { productId?: string; message?: string };
  if (!productId || !message?.trim()) {
    return NextResponse.json({ error: "productId + message required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  await admin.from("product_enquiries").insert({
    product_id: productId, user_id: user.id, message: message.trim(),
  });

  const { data: product } = await admin.from("products").select("name").eq("id", productId).maybeSingle();
  const ids = (process.env.ADMIN_TELEGRAM_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const { data: admins } = await admin.from("profiles").select("telegram_id").in("telegram_id", ids.map(Number));
  for (const a of admins ?? []) {
    await sendTelegramMessage(
      a.telegram_id,
      `🛒 New enquiry from ${user.first_name}:\nProduct: ${product?.name ?? "Unknown"}\n"${message.trim()}"`
    );
  }
  return NextResponse.json({ ok: true });
}