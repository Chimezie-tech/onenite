const API_KEY = process.env.AI_STUDIO_API_KEY;
const MODEL = process.env.AI_STUDIO_MODEL ?? "gemini-2.0-flash";

export interface ModerationResult {
  safe: boolean;
  reason: string | null;
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

export async function moderatePhoto(imageUrl: string, mimeType: string): Promise<ModerationResult> {
  if (!API_KEY) return { safe: false, reason: "Moderation unavailable" }; // fail closed

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { file_data: { mime_type: mimeType, file_uri: imageUrl } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    }
  );

  if (!res.ok) return { safe: false, reason: "Moderation service error" };

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  try {
    const parsed = JSON.parse(text) as { safe?: boolean; reason?: string | null };
    return { safe: parsed.safe === true, reason: parsed.reason ?? null };
  } catch {
    return { safe: false, reason: "Unparseable moderation response" };
  }
}