// Shared AI client for all edge functions.
// Uses Lovable AI Gateway (OpenAI-compatible) for fast, reliable responses.

export const OPENROUTER_MODEL = "google/gemini-2.5-flash";
const OPENROUTER_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function getKey() {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return key;
}

function baseHeaders() {
  return {
    "Authorization": `Bearer ${getKey()}`,
    "Content-Type": "application/json",
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
    const err: any = new Error(`AI gateway ${res.status}: ${errText.slice(0, 300)}`);
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
    console.error("AI gateway stream error:", res.status, errText);
    if (res.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
        { status: 429, headers: { ...opts.corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (res.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
        { status: 402, headers: { ...opts.corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ error: "AI service unavailable" }),
      { status: 500, headers: { ...opts.corsHeaders, "Content-Type": "application/json" } },
    );
  }

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
