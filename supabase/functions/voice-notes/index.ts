import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENHANCE_PROMPT = `You are a professional academic note-taker. Take the raw lecture transcript below and convert it into clean, structured, professional study notes suitable for a BS-level student.

RULES:
- Fix grammar, punctuation, and remove filler words ("um", "uh", "you know", repeated words).
- Preserve ALL technical content, definitions, formulas, names, and examples — do NOT invent facts.
- Organize with clear hierarchy:
  ### **🎯 Topic / Title** (infer from content)
  ### **📘 Key Concepts** — bullets with **bold keywords**
  ### **🧪 Examples / Formulas** — wrap math in $...$ or $$...$$
  ### **📝 Summary** — 2-4 concise bullets
- Use emojis in section headers, bullet points (-), and bold for key terms.
- Output ONLY the formatted markdown notes. No preamble, no "Here are your notes:", nothing extra.`;

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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body?.action;

    if (action === "transcribe") {
      const { audio, mimeType } = body;
      if (!audio || !mimeType) {
        return new Response(JSON.stringify({ error: "Missing audio or mimeType" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Cap audio at ~15MB base64 (~11MB raw) to keep latency sane
      if (audio.length > 15_000_000) {
        return new Response(JSON.stringify({ error: "Recording too long. Please keep under ~10 minutes." }), {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: "Transcribe the following audio verbatim. Output ONLY the spoken words as plain text. Do not add commentary, headings, timestamps, or speaker labels unless multiple distinct speakers are clearly present. Preserve technical terms accurately." },
                  { inlineData: { mimeType, data: audio } },
                ],
              },
            ],
            generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        return new Response(JSON.stringify({ error: "Transcription failed", detail: errText }), {
          status: geminiRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await geminiRes.json();
      const transcript = data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text || "")
        .join("")
        .trim() || "";

      return new Response(JSON.stringify({ transcript }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "enhance") {
      const { transcript } = body;
      if (!transcript || typeof transcript !== "string") {
        return new Response(JSON.stringify({ error: "Missing transcript" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { role: "system", parts: [{ text: ENHANCE_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: `Raw transcript:\n\n${transcript}` }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        return new Response(JSON.stringify({ error: "Enhancement failed", detail: errText }), {
          status: geminiRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await geminiRes.json();
      const notes = data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text || "")
        .join("")
        .trim() || "";

      return new Response(JSON.stringify({ notes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
