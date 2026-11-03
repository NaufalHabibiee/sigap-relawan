import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * AI client for Sigap. Uses Claude when ANTHROPIC_API_KEY is set, otherwise Gemini
 * when GEMINI_API_KEY is set. Returns null when neither is configured or the call
 * fails, so every AI feature can fall back to a rule-based result.
 *
 * Schemas are written once in Gemini's style (uppercase types) and converted to
 * standard JSON Schema for Claude's structured outputs.
 */
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);
}

export async function askJson<T>(prompt: string, schema: object): Promise<T | null> {
  if (process.env.ANTHROPIC_API_KEY) {
    const out = await askClaude<T>(prompt, schema);
    if (out) return out;
  }
  if (process.env.GEMINI_API_KEY) return askGemini<T>(prompt, schema);
  return null;
}

type Schema = { type?: string; properties?: Record<string, Schema>; items?: Schema; required?: string[]; enum?: unknown[] };

function toJsonSchema(s: Schema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (s.type) out.type = s.type.toLowerCase();
  if (s.enum) out.enum = s.enum;
  if (s.items) out.items = toJsonSchema(s.items);
  if (s.properties) {
    out.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, toJsonSchema(v)]));
    out.required = s.required ?? Object.keys(s.properties);
    out.additionalProperties = false;
  }
  return out;
}

let client: Anthropic | null = null;

async function askClaude<T>(prompt: string, schema: object): Promise<T | null> {
  try {
    client ??= new Anthropic({ timeout: 45_000, maxRetries: 1 });
    const response = await client.beta.messages.create({
      // Server-side fallback: if this model declines, the API re-runs on a fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: toJsonSchema(schema as Schema) },
      },
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      console.error("[ai] claude stopped:", response.stop_reason);
      return null;
    }
    const text = response.content.find((b) => b.type === "text");
    return text && text.type === "text" ? (JSON.parse(text.text) as T) : null;
  } catch (e) {
    if (e instanceof Anthropic.APIError) console.error("[ai] claude", e.status, e.message);
    else console.error("[ai] claude failed", e);
    return null;
  }
}

async function askGemini<T>(prompt: string, schema: object): Promise<T | null> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
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
