import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user using getClaims for proper JWT validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Use getClaims instead of getUser for proper JWT validation with signing-keys
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const userId = claimsData.claims.sub;

    const { messages } = await req.json();
    
    // Input validation
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (messages.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many messages: maximum 50 allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    // Build messages array, handling image content if present with validation
    const processedMessages = messages.map((msg: any) => {
      // Validate message structure
      if (!msg.role || typeof msg.role !== 'string') {
        throw new Error("Invalid message format: missing or invalid role");
      }

      // If the message has attached image data, format for vision
      if (msg.imageData && msg.role === 'user') {
        // Validate image data size (10MB limit)
        if (typeof msg.imageData === 'string' && msg.imageData.length > 10 * 1024 * 1024) {
          throw new Error("Image too large: maximum 10MB allowed");
        }
        
        return {
          role: 'user',
          content: [
            { type: 'text', text: (msg.content || 'Analyze this image and help me understand it.').slice(0, 10000) },
            { 
              type: 'image_url', 
              image_url: { 
                url: msg.imageData // base64 data URL
              } 
            }
          ]
        };
      }
      
      // Sanitize text content
      return {
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content.slice(0, 10000) : ''
      };
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://gpgc.lovable.app",
        "X-Title": "GPGC Portal",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
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
- For Math: Show step-by-step solutions and wrap math in LaTeX ($...$ inline, $$...$$ block)
- Don't just give definitions - help students truly understand

**Formatting (VERY IMPORTANT — make output visually rich and scannable):**
- Open detailed answers with a short intro line, then organize with markdown
- Use **H2 headings (##)** for major sections and **H3 (###)** for sub-sections
- Add a relevant **emoji** at the start of each heading (e.g. "## 🎯 Key Idea", "## 📘 Definition", "## 🧪 Example", "## ⚙️ How it Works", "## 📝 Steps", "## 💡 Tip", "## ⚠️ Common Mistakes", "## 🧠 Summary")
- Use bullet lists with **bold keywords** at the start of each bullet for fast scanning
- Use numbered lists for step-by-step procedures
- Use > blockquotes for important notes, tips, or warnings
- Use tables when comparing 2+ items
- Use inline code formatting for variables/keywords and fenced code blocks with language tags
- End longer answers with a "## 🧠 Summary" or "## ✅ Key Takeaways" section
- Avoid walls of text — break content into short paragraphs (2-3 lines max)

**Image/Document Analysis:**
When a user uploads an image or document:
- If it's a question paper or assignment: Solve it step by step
- If it's a diagram: Explain what it shows
- If it's handwritten notes: Read and help understand or correct
- If it's a textbook page: Explain the concepts clearly
- Always use OCR to read any text in images

**Key Principle:** When a student asks about a concept (like interference, ohm's law, loops, grammar rules), assume they want to LEARN and UNDERSTAND it, not just get a dictionary definition. Teach them properly!

Be friendly, encouraging, and patient. You're here to help students succeed in their studies.`,
          },
          ...processedMessages,
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
