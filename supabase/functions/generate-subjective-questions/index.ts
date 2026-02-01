import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "./_shared/cors.ts";
import type { QuestionRequest, SubjectiveQuestion } from "./_shared/types.ts";
import {
  sanitizeSubject,
  sanitizeTopics,
  validateCounts,
  validateDifficultyLevels,
  validateQuestionTypes,
} from "./_shared/validate.ts";
import {
  generatePaperOnce,
  PaymentRequiredError,
  RateLimitError,
} from "./_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as QuestionRequest;

    const subject = sanitizeSubject(body.subject);
    const topics = sanitizeTopics(body.topics);
    const { short, long } = validateCounts(body.shortCount, body.longCount);
    const questionTypes = validateQuestionTypes(body.questionTypes);
    const difficultyLevels = validateDifficultyLevels(body.difficultyLevels);

    const questions = await generatePaperOnce({
      subject,
      topics,
      questionTypes,
      difficultyLevels,
      shortCount: short,
      longCount: long,
    });

    return jsonResponse({
      success: true,
      questions,
      subject,
      shortCount: (questions as SubjectiveQuestion[]).filter((q: SubjectiveQuestion) => q.type === "short").length,
      longCount: (questions as SubjectiveQuestion[]).filter((q: SubjectiveQuestion) => q.type === "long").length,
      totalCount: questions.length,
    });
  } catch (error: unknown) {
    console.error("Error generating subjective questions:", error);

    if (error instanceof RateLimitError) {
      return jsonResponse(
        { success: false, error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 },
      );
    }

    if (error instanceof PaymentRequiredError) {
      return jsonResponse(
        { success: false, error: "Service temporarily unavailable. Please try again later." },
        { status: 402 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    const isBadRequest =
      message.toLowerCase().includes("invalid") ||
      message.toLowerCase().includes("maximum") ||
      message.toLowerCase().includes("please request") ||
      message.toLowerCase().includes("too many");

    return jsonResponse(
      { success: false, error: message },
      { status: isBadRequest ? 400 : 500 },
    );
  }
});
