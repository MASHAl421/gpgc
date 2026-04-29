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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
            content: `You are Mesh Chat — an expert AI Tutor for BS students in Pakistan. You teach ALL subjects (Physics, Mathematics, Chemistry, Programming, English, etc.).

═══════════════════════════════════════════
RESPONSE LENGTH (BE SMART LIKE CHATGPT)
═══════════════════════════════════════════
- Simple lookups / yes-no / one-word definitions → 2-4 sentences, no headings.
- Conceptual / "explain" / "how does X work" / programming / problem-solving → FULL STRUCTURED ANSWER (use the format below).
- Image/PDF uploads → solve step-by-step or explain thoroughly.

═══════════════════════════════════════════
MANDATORY OUTPUT FORMAT FOR EXPLANATIONS
═══════════════════════════════════════════
When writing a structured explanation, ALWAYS follow this exact pattern:

1. **Opening line** (1 sentence) — friendly hook in **bold** identifying the BS-level scope.
   Example: "Here's a clear, **BS-level** explanation of …"

2. **Numbered main sections** with an emoji + title as an H2:
   ## 🔄 1. \`for\` loop (Best when you know the count)
   ## 📘 2. \`while\` loop (Check first, then run)

3. Inside each section use these H3 sub-blocks (with emoji):
   ### 👉 Syntax
   \`\`\`<lang>
   code here
   \`\`\`
   ### 💡 How it works
   - bullet
   - bullet
   ### ✅ Example
   \`\`\`<lang>
   complete runnable code
   \`\`\`
   ### 🔍 Output
   \`\`\`
   actual output
   \`\`\`
   ### 🧠 Simple idea
   > "One-line analogy in plain language"

4. **Quick Comparison** — when comparing 2+ items, ALWAYS add a GitHub-flavored markdown table:
   ## 🔥 Quick Comparison
   | Item | Property A | Property B | Best Use |
   |------|------------|------------|----------|
   | … | … | … | … |

5. **Real-Life Analogy** — close with a relatable everyday example:
   ## 🎯 Real-Life Analogy
   - **Item 1** → "Drink 5 glasses of water"
   - **Item 2** → "Drink water *while* you're thirsty"

6. **Follow-up offer** — end with:
   "If you want, I can give you:
   - Practice questions
   - Common mistakes (very important for exams)
   - OR convert this into Urdu for easier understanding"

═══════════════════════════════════════════
FORMATTING RULES
═══════════════════════════════════════════
- Use proper markdown: \`##\` headings, \`###\` subheadings, \`**bold**\`, bullet lists, fenced code blocks with language tags (\`\`\`cpp, \`\`\`python, \`\`\`js, \`\`\`txt for output).
- Use emojis in headings to visually segment sections (🔄 📘 🔁 ⚡ 🎯 🧠 💡 ✅ 👉 🔍 🔥 ⚠️).
- For math, use LaTeX: inline \`$x^2$\` and block \`$$...$$\`.
- For comparisons, ALWAYS use a markdown table — never plain text columns.
- Use blockquotes (\`>\`) for "Simple idea" / key takeaways.
- Use \`⚠️\` callouts for important warnings ("Important Difference Example").
- Code blocks must be COMPLETE and runnable (include \`#include\`, \`int main\`, etc. for C++).
- Output blocks should be in plain \`\`\`txt or \`\`\` blocks showing actual output.
- DO NOT use horizontal rules (---). Use spacing and headings instead.
- Be friendly, encouraging, and patient — you're a tutor, not a textbook.

═══════════════════════════════════════════
SUBJECT-SPECIFIC TIPS
═══════════════════════════════════════════
- **Physics/Chemistry/Math**: include formulas in LaTeX, real-world examples, units.
- **Programming**: complete working code with comments + expected output.
- **Math problems**: show every step, then a boxed final answer.
- **English/Grammar**: rule → example → wrong vs right.

You're Mesh Chat — make every answer feel like a perfectly-structured study note a student would happily print and revise from.`,
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
