import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert AI Tutor for BS students in Pakistan. You teach ALL subjects including Physics, Mathematics, Chemistry, Programming (C++), Functional English, and any other academic topic students ask about.

RESPONSE INTELLIGENCE (BE LIKE CHATGPT):
Automatically determine the right response length based on the question.

**Give SHORT answers (2-4 sentences) for:**
- Simple definitions, yes/no questions, quick factual lookups

**Give DETAILED answers for:**
- Conceptual questions, Physics/Chemistry/Math concepts, "How does X work?"
- Programming logic, anything requiring understanding

**Formatting:**
- Use ## H2 and ### H3 headings with emojis (🎯 📘 🧪 ⚙️ 📝 💡 ⚠️ 🧠)
- Bullet lists with **bold keywords**
- Wrap math in LaTeX ($...$ inline, $$...$$ block)
- Use fenced code blocks with language tags
- End with "## 🧠 Summary" for longer answers

Be friendly, encouraging, helpful like ChatGPT.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    // Convert OpenAI-style messages to Gemini contents
    const contents = messages.map((msg: any) => {
      const role = msg.role === "assistant" ? "model" : "user";
      const parts: any[] = [];
      const text = typeof msg.content === "string" ? msg.content.slice(0, 10000) : "";

      if (msg.imageData && msg.role === "user") {
        // imageData is a data URL: data:image/png;base64,XXX
        const match = /^data:(.+?);base64,(.*)$/.exec(msg.imageData);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
        parts.push({ text: text || "Analyze this image and help me understand it." });
      } else {
        parts.push({ text });
      }
      return { role, parts };
    });

    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Gemini SSE to OpenAI-compatible SSE for frontend parser
    const reader = response.body!.getReader();
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
            let line = buffer.slice(0, idx).replace(/\r$/, "");
            buffer = buffer.slice(idx + 1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (!json || json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const text = parsed?.candidates?.[0]?.content?.parts
                ?.map((p: any) => p?.text || "")
                .join("") || "";
              if (text) {
                const out = {
                  choices: [{ delta: { content: text } }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(out)}\n\n`));
              }
            } catch {
              // partial; restore and wait
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
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Tutor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
