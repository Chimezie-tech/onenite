const API_KEY = process.env.AI_STUDIO_API_KEY;
const MODEL = process.env.AI_STUDIO_MODEL ?? "gemini-3.8-flash";
export interface ModerationResult {
  safe: boolean;
  reason: string | null;
  serviceError: boolean;
}

const PROMPT = `You are a strict photo moderation system for a dating app.
Analyze the image and respond with ONLY valid JSON in this shape:
{"safe": boolean, "reason": string | null}
Reject (safe=false) if ANY of the following are true:
- Nudity, sexual content, or suggestive posing
- No visible human face (animals, objects, landscapes, cartoons, logos)
- Obvious stock photo, celebrity portrait, or watermark overlay
- Violence, weapons, or illegal substances
Approve (safe=true) only for genuine photos showing a real person's face.
Keep "reason" to max 8 words, or null when safe.`;

export async function moderatePhoto(
  imageUrl: string,
  mimeType: string
): Promise<ModerationResult> {
  if (!API_KEY) {
    return { safe: false, reason: "Moderation unavailable", serviceError: true };
  }

  // 1) Fetch image bytes server-side; Gemini receives inline base64 (no URL dependency)
  let base64: string;
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return { safe: false, reason: "Could not read image", serviceError: true };
    }
    base64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
  } catch {
    return { safe: false, reason: "Could not read image", serviceError: true };
  }

  // 2) Ask Gemini
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[moderation] Gemini HTTP ${res.status}: ${body.slice(0, 500)}`);
    return { safe: false, reason: "Moderation service error", serviceError: true };
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  try {
    const parsed = JSON.parse(text) as { safe?: boolean; reason?: string | null };
    return { safe: parsed.safe === true, reason: parsed.reason ?? null, serviceError: false };
  } catch {
    return { safe: false, reason: "Unparseable moderation response", serviceError: true };
  }
}