// Shared OpenRouter client for all edge functions.
// Using a fast free model — gemini-2.0-flash-exp is much faster than gpt-oss/nemotron free tiers.

export const OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getKey() {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  return key;
}

function baseHeaders() {
  return {
    "Authorization": `Bearer ${getKey()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://gpgcswabi.lovable.app",
    "X-Title": "GPGC Portal",
  };
}

export interface ORMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

/** Non-streaming chat completion. Returns the full assistant text. */
export async function openRouterChat(opts: {
  messages: ORMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormatJson?: boolean;
}): Promise<string> {
  const body: any = {
    model: OPENROUTER_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 4096,
  };
  if (opts.responseFormatJson) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err: any = new Error(`OpenRouter ${res.status}: ${errText.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content ?? "");
}

/**
 * Streaming chat completion. Returns a Response with OpenAI-compatible SSE
 * (data: {choices:[{delta:{content}}]}). Safe to proxy straight to clients
 * that expect that format.
 */
export async function openRouterStream(opts: {
  messages: ORMessage[];
  temperature?: number;
  maxTokens?: number;
  corsHeaders: Record<string, string>;
}): Promise<Response> {
  const body = {
    model: OPENROUTER_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 4096,
    stream: true,
  };

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    console.error("OpenRouter stream error:", res.status, errText);
    if (res.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
        { status: 429, headers: { ...opts.corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (res.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
        { status: 402, headers: { ...opts.corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ error: "AI service unavailable" }),
      { status: 500, headers: { ...opts.corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // OpenRouter already streams OpenAI-style SSE. Pass through, but normalize
  // to ensure the client always gets {choices:[{delta:{content}}]} chunks
  // (some reasoning models also emit `reasoning` deltas we ignore).
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).replace(/\r$/, "");
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const content = parsed?.choices?.[0]?.delta?.content;
            if (typeof content === "string" && content.length > 0) {
              const out = { choices: [{ delta: { content } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(out)}\n\n`));
            }
          } catch {
            // partial line; push it back and wait for more
            buffer = line + "\n" + buffer;
            break;
          }
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: { ...opts.corsHeaders, "Content-Type": "text/event-stream" },
  });
}
