import "server-only";

/**
 * Thin Gemini client. Returns null when no key is configured or the call fails,
 * so every AI feature can fall back to a rule-based result.
 */
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function aiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function askJson<T>(prompt: string, schema: object): Promise<T | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error("[ai] gemini", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? (JSON.parse(text) as T) : null;
  } catch (e) {
    console.error("[ai] gemini failed", e);
    return null;
  }
}
