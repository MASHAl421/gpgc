import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { openRouterStream } from "../_shared/openrouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildPrompt(p: any) {
  const lengthMap: Record<string, string> = {
    short: "around 600-900 words (3-4 pages handwritten)",
    medium: "around 1200-1600 words (5-7 pages handwritten)",
    long: "around 2000-2800 words (8-12 pages handwritten)",
  };
  const langInstr: Record<string, string> = {
    english: "Write in SIMPLE, easy English. Avoid heavy vocabulary. Pakistani BS student should understand it in one read. Short sentences. Friendly academic tone.",
    "roman-urdu": "Write in Roman Urdu (Urdu written using English letters). Mix some English technical terms where natural, like a Pakistani student would.",
    urdu: "Write in proper Urdu script. Use clear, simple Urdu suitable for college students.",
  };

  return `You are writing a UNIVERSITY assignment for a Pakistani BS-level student. The writing must sound like a REAL HUMAN STUDENT wrote it — NOT like an AI. Avoid robotic phrases, avoid "In conclusion", avoid "delve", "tapestry", "furthermore" overuse. Use natural flow, simple words, occasional small imperfections, real-life Pakistani context examples where it fits.

STUDENT INFO:
- Name: ${p.studentName || "Student"}
- Roll Number: ${p.rollNumber || "—"}
- Class: BS Semester ${p.semester || "—"}
- Subject: ${p.subject}
- Teacher: ${p.teacherName || "—"}
- Submission Date: ${p.dueDate || "—"}
- Institution: GPGC Swabi

ASSIGNMENT DETAILS:
- Topic: ${p.topic}
- Assignment Type: ${p.assignmentType}
- Length: ${lengthMap[p.length] || lengthMap.medium}
- Language Style: ${langInstr[p.language] || langInstr.english}
- Include real-world Pakistani examples: ${p.pakistaniContext ? "YES — use desi examples (PTCL, K-Electric, local industries, daily-life scenarios)." : "Only if natural."}
- Include diagrams: ${p.includeDiagrams ? "YES — describe diagrams in [DIAGRAM: description] tags where useful." : "NO"}
- Include formulas/equations: ${p.includeFormulas ? "YES — use proper LaTeX ($...$ and $$...$$)." : "Only if essential."}
- Include references: ${p.includeReferences ? "YES — add a References section with 4-6 realistic citations (books, papers, websites)." : "NO"}
- Include Table of Contents: ${p.includeTOC ? "YES" : "NO"}

REQUIRED STRUCTURE (markdown):
# ${p.topic}

**Name:** ${p.studentName || "Student"}  
**Roll No:** ${p.rollNumber || "—"}  
**Subject:** ${p.subject}  
**Semester:** ${p.semester || "—"}  
**Submitted To:** ${p.teacherName || "—"}  
**Date:** ${p.dueDate || "—"}

${p.includeTOC ? "## Table of Contents\n(list every heading with short description)\n" : ""}

## Introduction
(2-3 paragraphs — what the topic is, why it matters, what this assignment will cover. Sound like a curious student, not an encyclopedia.)

## Main Body
(Break into 3-6 clear ## or ### subheadings appropriate to "${p.topic}". Explain concepts step-by-step. Use bullet points, examples, mini-stories, comparisons. ${p.includeFormulas ? "Show derivations." : ""} ${p.includeDiagrams ? "Mark diagrams with [DIAGRAM: ...] tags." : ""})

## Real-Life Applications
(How "${p.topic}" is actually used — give 3-5 practical examples, ideally connected to Pakistan/daily life.)

## Advantages and Limitations
(Honest pros and cons in bullet form.)

## Conclusion
(2 short paragraphs — summarize without saying "in conclusion". Add a personal-feeling sentence about what the student learned.)

${p.includeReferences ? "## References\n(4-6 realistic numbered references — author, title, year, publisher/URL.)" : ""}

CRITICAL RULES:
- Sound human and Pakistani. Use phrases a real student would write.
- No fluff. No repetition. No AI-style hedging ("It is important to note...").
- ${langInstr[p.language] || langInstr.english}
- Hit the target length: ${lengthMap[p.length] || lengthMap.medium}.
- Output ONLY the assignment markdown. No preamble like "Here is your assignment".

Start writing now.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    if (!body?.subject || !body?.topic) {
      return new Response(JSON.stringify({ error: "Subject and topic are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(body);

    return await openRouterStream({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      maxTokens: 8192,
      corsHeaders,
    });
  } catch (error) {
    console.error("Assignment generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
