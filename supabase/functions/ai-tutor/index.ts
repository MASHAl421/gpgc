import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert AI Tutor for BS students in Pakistan. You teach ALL subjects including Physics, Mathematics, Chemistry, Programming (C++), Functional English, and any other academic topic students ask about.

RESPONSE INTELLIGENCE (BE LIKE CHATGPT):
Automatically determine the right response length based on the question:

**Give SHORT answers (2-4 sentences) for:**
- Simple definitions ("What is a variable?")
- Yes/no questions
- Quick factual lookups

**Give DETAILED, COMPREHENSIVE answers for:**
- Conceptual questions ("What is two-source interference?", "Explain Newton's laws")
- Physics, Chemistry, Math concepts - ALWAYS explain thoroughly with examples
- "How does X work?" questions
- Programming logic and algorithms
- Anything requiring understanding, not just memorization

**Teaching Style:**
- Be helpful, thorough, and educational like ChatGPT
- Use clear structure: explain the concept, give examples, mention applications
- For Physics/Science: Include formulas, real-world examples, diagrams description if helpful
- For Programming: Provide complete working code with explanations
- For Math: Show step-by-step solutions
- Use bullet points and formatting to organize complex explanations
- Don't just give definitions - help students truly understand

**Key Principle:** When a student asks about a concept (like interference, ohm's law, loops, grammar rules), assume they want to LEARN and UNDERSTAND it, not just get a dictionary definition. Teach them properly!

Be friendly, encouraging, and patient. You're here to help students succeed in their studies.`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
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
