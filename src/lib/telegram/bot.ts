const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = "https://api.telegram.org";

export interface SendOptions {
  reply_markup?: {
    inline_keyboard: Array<Array<{ text: string; url: string }>>;
  };
}

/** Sends a message via the OneNite bot. Returns false (never throws) on failure. */
export async function sendTelegramMessage(
  chatId: number,
  text: string,
  options?: SendOptions
): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const res = await fetch(`${API}/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, ...options }),
    });
    if (!res.ok) {
      console.error(`[bot] sendMessage ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[bot] sendMessage failed", err);
    return false;
  }
}

export const OPEN_APP_BUTTON: SendOptions = {
  reply_markup: {
    inline_keyboard: [[{ text: "Open OneNite ❤️", url: "https://t.me/OneNite_bot/app" }]],
  },
};

export const OPEN_LIKES_BUTTON: SendOptions = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "See who likes you 💗", url: "https://t.me/OneNite_bot/app?startapp=likes" }],
    ],
  },
};