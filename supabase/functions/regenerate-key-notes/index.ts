// Regenerate short, easy-to-remember key notes for given topics using Lovable AI Gateway.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function buildPrompt(subject: string, unit: string, topic: string, urdu: boolean) {
  if (urdu) {
    return `آپ ایک ماہر استاد ہیں۔ مضمون: "${subject}"، یونٹ: "${unit}"، ٹاپک: "${topic}"۔
طلباء کے لیے ایک مختصر اور آسان کلیدی نوٹ تیار کریں جو انہیں اس ٹاپک کا بنیادی خیال یاد رکھنے میں مدد دے۔

سخت ہدایات:
- صرف اردو میں لکھیں۔ (اگر عربی آیات/اصطلاحات ہوں تو استعمال کر سکتے ہیں)
- زیادہ سے زیادہ 150 الفاظ
- مارک ڈاؤن ٹیبلز یا --- استعمال نہ کریں
- ساخت:
  ### **${topic}**
  ایک یا دو جملے کا تعارف۔
  **اہم نکات:**
  - نکتہ 1
  - نکتہ 2
  - نکتہ 3 (3 سے 7 نکات)
  **یاد رکھنے کا آسان طریقہ:** ایک مختصر یادداشت/مثال
صرف نوٹ کا متن واپس کریں، کوئی اضافی تبصرہ نہیں۔`;
  }
  return `You are an expert teacher. Subject: "${subject}", Unit: "${unit}", Topic: "${topic}".
Create a SHORT, EASY key note that helps a BS-level student remember the core IDEA of this topic quickly.

Strict rules:
- Maximum 150 words
- No markdown tables, no --- separators
- Use real newlines
- Structure exactly:
  ### **${topic}**
  One-sentence plain-English idea.
  **Key Points:**
  - point 1
  - point 2
  - point 3 (3 to 7 bullets, each one short line)
  **Memory Hook:** one mnemonic, analogy, or formula to remember it
Return ONLY the note text, no preamble.`;
}

async function generateNote(subject: string, unit: string, topic: string) {
  const urdu = /islamic|اسلام/i.test(subject);
  const prompt = buildPrompt(subject, unit, topic, urdu);

  // Retry with backoff on 429/503
  let lastErr = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? "";
      if (!text.trim()) throw new Error("Empty AI response");
      return text.trim();
    }
    lastErr = `${res.status}: ${(await res.text()).slice(0, 200)}`;
    if (res.status === 429 || res.status === 503) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    throw new Error(`AI ${lastErr}`);
  }
  throw new Error(`AI retries exhausted ${lastErr}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { topicIds } = await req.json();
    if (!Array.isArray(topicIds) || topicIds.length === 0) {
      return new Response(JSON.stringify({ error: "topicIds required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: topics, error } = await admin
      .from("topics")
      .select("id, name, units:unit_id(name, subjects:subject_id(name))")
      .in("id", topicIds);
    if (error) throw error;

    const results: any[] = [];
    for (const t of topics ?? []) {
      const subject = (t as any).units?.subjects?.name ?? "";
      const unit = (t as any).units?.name ?? "";
      try {
        const note = await generateNote(subject, unit, t.name);
        await admin.from("key_notes").delete().eq("topic_id", t.id);
        const { error: insErr } = await admin.from("key_notes").insert({
          topic_id: t.id,
          title: t.name,
          content: note,
          order_index: 0,
        });
        if (insErr) throw insErr;
        results.push({ topic_id: t.id, ok: true });
      } catch (e: any) {
        results.push({ topic_id: t.id, ok: false, error: String(e?.message ?? e) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
