import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STYLE_PROMPTS: Record<string, string> = {
  detailed: `Produce DETAILED, professional academic notes with full explanations.
Structure:
### **🎯 Title** (infer)
### **📘 Key Concepts** — bullets with **bold keywords** and 1–2 sentence explanations
### **🧪 Examples / Formulas** — wrap math in $...$ or $$...$$
### **💡 Important Points**
### **📝 Summary** — 3–5 concise bullets`,
  concise: `Produce CONCISE bullet-point notes. No long paragraphs. Maximum brevity while keeping every key fact.
Structure:
### **🎯 Title**
### **📘 Main Points** — short bullets, **bold keywords**
### **📝 TL;DR** — 2–3 lines`,
  flashcards: `Produce STUDY FLASHCARDS as Q&A pairs covering every key concept.
Format each card EXACTLY as:
### **Q: <question>**
**A:** <clear answer, 1–3 sentences>

Generate 6–15 cards depending on content depth. End with:
### **📝 Quick Review** — 3 bullet recap`,
  summary: `Produce a tight EXECUTIVE SUMMARY (200–350 words) of the lecture.
Structure:
### **🎯 Topic**
### **📘 Overview** — 1 short paragraph
### **🔑 Key Takeaways** — 4–6 bullets`,
};

const BASE_RULES = `You are a professional academic note-taker for a BS-level student in Pakistan.
Take the raw lecture transcript and convert it into clean, structured, professional study notes.

RULES:
- Fix grammar, punctuation, and remove filler words ("um", "uh", repeated words).
- Preserve ALL technical content, definitions, formulas, names, and examples — do NOT invent facts.
- Use emojis in section headers, bullet points (-), and bold for key terms.
- Output ONLY the formatted markdown notes. No preamble, no "Here are your notes:", nothing extra.`;

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function extFromMime(mime: string): string {
  const m = mime.split(";")[0].trim();
  if (m === "audio/webm") return "webm";
  if (m === "audio/mp4") return "mp4";
  if (m === "audio/mpeg") return "mp3";
  if (m === "audio/wav") return "wav";
  if (m === "audio/ogg") return "ogg";
  return "webm";
}

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
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
      if (audio.length > 15_000_000) {
        return new Response(JSON.stringify({ error: "Recording too long. Please keep under ~10 minutes." }), {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const bytes = base64ToBytes(audio);
      const ext = extFromMime(mimeType);
      const fd = new FormData();
      fd.append("model", "openai/gpt-4o-mini-transcribe");
      fd.append("file", new Blob([bytes], { type: mimeType.split(";")[0] }), `recording.${ext}`);

      const res = await fetch(`${GATEWAY}/audio/transcriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: fd,
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Transcription error:", res.status, errText);
        const status = res.status === 429 || res.status === 402 ? res.status : 500;
        return new Response(JSON.stringify({ error: "Transcription failed", detail: errText }), {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      const transcript = String(data?.text ?? "").trim();

      return new Response(JSON.stringify({ transcript }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "enhance") {
      const { transcript, style } = body;
      if (!transcript || typeof transcript !== "string") {
        return new Response(JSON.stringify({ error: "Missing transcript" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const styleKey = (typeof style === "string" && STYLE_PROMPTS[style]) ? style : "detailed";
      const systemPrompt = `${BASE_RULES}\n\n${STYLE_PROMPTS[styleKey]}`;

      const res = await fetch(`${GATEWAY}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Raw transcript:\n\n${transcript}` },
          ],
          temperature: 0.4,
          max_tokens: 4096,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Enhance error:", res.status, errText);
        const status = res.status === 429 || res.status === 402 ? res.status : 500;
        return new Response(JSON.stringify({ error: "Enhancement failed", detail: errText }), {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      const notes = String(data?.choices?.[0]?.message?.content ?? "").trim();

      return new Response(JSON.stringify({ notes, style: styleKey }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-notes error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
