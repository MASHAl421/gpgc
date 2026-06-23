// Regenerate short, easy-to-remember key notes for given topics via OpenRouter.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { openRouterChat } from "../_shared/openrouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function buildPrompt(subject: string, unit: string, topic: string, urdu: boolean) {
  if (urdu) {
    return `آپ ایک ماہر استاد ہیں۔ مضمون: "${subject}"، یونٹ: "${unit}"، ٹاپک: "${topic}"۔
طلباء کے لیے ایک واضح، آسان اور مکمل کلیدی نوٹ تیار کریں۔

سخت ہدایات:
- صرف اردو میں لکھیں (عربی آیات/اصطلاحات کی اجازت ہے)
- مارک ڈاؤن ٹیبلز یا --- استعمال نہ کریں، صرف اصلی نئی لائنیں
- ساخت بالکل یہی ہو:
  ### **${topic}**
  **بنیادی خیال / تعریف:** ایک یا دو واضح جملے
  **اہم نکات:**
  - نکتہ 1 — مختصر وضاحت
  - نکتہ 2 — مختصر وضاحت
  - نکتہ 3 — مختصر وضاحت
  - نکتہ 4 — مختصر وضاحت (کم از کم 4، زیادہ سے زیادہ 6 نکات، اگر ضروری ہو تو زیادہ)
  **مثالیں:** ایک یا دو حقیقی مثالیں
  **یاد رکھنے کا آسان طریقہ:** ایک مختصر یادداشت/مماثلت
صرف نوٹ کا متن واپس کریں، کوئی اضافی تبصرہ نہیں۔`;
  }
  return `You are an expert teacher. Subject: "${subject}", Unit: "${unit}", Topic: "${topic}".
Create a CLEAR, EASY, but COMPLETE key note for a BS-level student.

Strict rules:
- No markdown tables, no --- separators. Use real newlines.
- Structure exactly:
  ### **${topic}**
  **Main Idea / Definition:** one or two clear sentences capturing the core concept.
  **Key Points:**
  - Point 1 — short explanation
  - Point 2 — short explanation
  - Point 3 — short explanation
  - Point 4 — short explanation (4 to 6 bullets, add more only if the topic truly needs it)
  **Examples:** one or two concrete examples (code snippet, real-life case, or worked example as appropriate)
  **Memory Hook:** one mnemonic, analogy, or formula to remember it
- Keep language simple but the explanation must be complete enough to understand the topic.
Return ONLY the note text, no preamble.`;
}

async function generateNote(subject: string, unit: string, topic: string) {
  const urdu = /islamic|اسلام/i.test(subject);
  const prompt = buildPrompt(subject, unit, topic, urdu);

  let lastErr = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const text = await openRouterChat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        maxTokens: 1000,
      });
      if (!text.trim()) throw new Error("Empty AI response");
      return text.trim();
    } catch (e: any) {
      lastErr = String(e?.message ?? e);
      const status = e?.status;
      if (status === 429 || status === 503) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw new Error(`AI ${lastErr}`);
    }
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

    const updated = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    return new Response(JSON.stringify({ results, updated, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
