import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { openRouterStream, type ORMessage } from "../_shared/openrouter.ts";

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

    // Convert client messages to OpenAI-style messages. Support optional imageData (data URL).
    const orMessages: ORMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];
    for (const msg of messages) {
      const role: "user" | "assistant" = msg.role === "assistant" ? "assistant" : "user";
      const text = typeof msg.content === "string" ? msg.content.slice(0, 10000) : "";
      if (msg.imageData && role === "user") {
        orMessages.push({
          role,
          content: [
            { type: "image_url", image_url: { url: msg.imageData } },
            { type: "text", text: text || "Analyze this image and help me understand it." },
          ],
        });
      } else {
        orMessages.push({ role, content: text });
      }
    }

    return await openRouterStream({
      messages: orMessages,
      temperature: 0.7,
      maxTokens: 2048,
      corsHeaders,
    });
  } catch (error) {
    console.error("AI Tutor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
