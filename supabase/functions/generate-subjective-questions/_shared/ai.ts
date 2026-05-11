import { LIMITS, type Category, type Difficulty, type SubjectiveQuestion } from "./types.ts";

export class RateLimitError extends Error {
  constructor(message = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

export class PaymentRequiredError extends Error {
  constructor(message = "Service temporarily unavailable") {
    super(message);
    this.name = "PaymentRequiredError";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripFences(text: string) {
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

function extractJSONObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

function parseModelJSON(raw: string) {
  const cleaned = extractJSONObject(stripFences(raw));
  return JSON.parse(cleaned);
}

function buildPaperPrompt(params: {
  subject: string;
  topicsText: string;
  typesText: string;
  difficultiesText: string;
  shortCount: number;
  longCount: number;
  mode: "normal" | "large";
  requestId?: string;
}) {
  const {
    subject,
    topicsText,
    typesText,
    difficultiesText,
    shortCount,
    longCount,
    mode,
    requestId,
  } = params;

  const shortAnswerGuide = mode === "large"
    ? "Answers should be 1-2 sentences (concise)."
    : "Answers should be 2-4 sentences.";

  const longAnswerGuide = mode === "large"
    ? "Answers should be 3-5 sentences (concise but complete)."
    : "Answers should be 5-10 sentences with proper explanation.";

  const largeModeNote = mode === "large"
    ? "IMPORTANT: This is a LARGE paper. Keep answers concise to fit within the response limits while staying accurate."
    : "";

  const requestIdLine = requestId ? `REQUEST_ID: ${requestId}\n` : "";

  return `You are an expert exam paper generator for BS Semester 1 students in Pakistan. Generate subjective questions with detailed answers.

${requestIdLine}

SUBJECT: ${subject}
TOPICS: ${topicsText}
QUESTION TYPES: ${typesText}
DIFFICULTY LEVELS: ${difficultiesText}

Generate exactly ${shortCount} SHORT questions and ${longCount} LONG questions.
${largeModeNote}

GUIDELINES:
1. **Short Questions** (2-4 lines answer):
   - Define terms, explain concepts briefly
   - "What is...", "Define...", "Differentiate between...", "List..."
   - ${shortAnswerGuide}

2. **Long Questions** (detailed paragraph answer):
   - Explain in detail, describe processes, compare and contrast
   - "Explain in detail...", "Describe the process of...", "Discuss..."
   - ${longAnswerGuide}

3. **For Programming Fundamentals (C++):**
   - Short: Define variable, explain operators, syntax questions
   - Long: Write programs, explain algorithms, trace output with explanation

4. **For Functional English:**
   - Short: Grammar rules, definitions, identify parts of speech
   - Long: Essay writing, paragraph construction, comprehension

5. **Question Types:**
   - Exercise: Practice problems, code writing, grammar exercises
   - Conceptual: Theory, definitions, explanations

6. **Difficulty Distribution:**
   - Easy: Basic definitions, simple examples
   - Medium: Application of concepts
   - Hard: Complex problems, critical thinking

RESPONSE FORMAT (JSON only, no markdown):
{
  "questions": [
    {
      "id": "q-unique-id",
      "question": "Question text here?",
      "answer": "Detailed answer here...",
      "type": "short" | "long",
      "category": "exercise" | "conceptual",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

Return valid JSON only.`;
}

async function callLovableAI(prompt: string) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY")}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://gpgc.lovable.app",
      "X-Title": "GPGC Portal",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-exp:free",
      messages: [
        {
          role: "system",
          content:
            "You are an expert academic question generator. Always respond with valid JSON only (no markdown).",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      // Large papers need a bit more room, but we still keep it bounded.
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const t = await response.text().catch(() => "");
    console.error("AI API error:", response.status, t);
    if (response.status === 429) throw new RateLimitError();
    if (response.status === 402) throw new PaymentRequiredError();
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return String(data?.choices?.[0]?.message?.content ?? "");
}

function normalizeQuestions(
  rawQuestions: any[],
  batchShortCount: number,
): SubjectiveQuestion[] {
  const safeArray = Array.isArray(rawQuestions) ? rawQuestions : [];

  return safeArray.map((q: any, index: number) => {
    const defaultType: "short" | "long" = index < batchShortCount ? "short" : "long";
    const type = q?.type === "short" || q?.type === "long" ? q.type : defaultType;

    const category: Category = q?.category === "exercise" || q?.category === "conceptual"
      ? q.category
      : "conceptual";

    const difficulty: Difficulty = q?.difficulty === "easy" || q?.difficulty === "medium" || q?.difficulty === "hard"
      ? q.difficulty
      : "medium";

    return {
      id: typeof q?.id === "string" && q.id.length ? q.id : `q-${crypto.randomUUID()}`,
      question: String(q?.question ?? "").trim(),
      answer: String(q?.answer ?? "").trim(),
      type,
      category,
      difficulty,
    };
  }).filter((q) => q.question.length > 0 && q.answer.length > 0);
}

async function generateBatch(params: {
  subject: string;
  topicsText: string;
  typesText: string;
  difficultiesText: string;
  shortCount: number;
  longCount: number;
  mode: "normal" | "large";
  requestId?: string;
}) {
  const prompt = buildPaperPrompt(params);

  // Retry parse errors a couple times
  for (let attempt = 0; attempt <= LIMITS.maxParseRetries; attempt++) {
    try {
      // Retry rate limit errors separately with backoff
      for (let rlAttempt = 0; rlAttempt <= LIMITS.maxRateLimitRetries; rlAttempt++) {
        try {
          const content = await callLovableAI(prompt);
          const parsed = parseModelJSON(content);
          if (!parsed?.questions || !Array.isArray(parsed.questions)) {
            throw new Error("Invalid response format");
          }
          return normalizeQuestions(parsed.questions, params.shortCount);
        } catch (e) {
          if (e instanceof RateLimitError && rlAttempt < LIMITS.maxRateLimitRetries) {
            await sleep(1200 * (rlAttempt + 1));
            continue;
          }
          throw e;
        }
      }
    } catch (e) {
      if (attempt < LIMITS.maxParseRetries) continue;
      throw e;
    }
  }

  return [];
}

export async function generatePaperOnce(params: {
  subject: string;
  topics: string[];
  questionTypes: Category[];
  difficultyLevels: Difficulty[];
  shortCount: number;
  longCount: number;
  requestId?: string;
}) {
  const totalRequested = params.shortCount + params.longCount;
  const mode: "normal" | "large" = totalRequested >= 30 ? "large" : "normal";

  const topicsText = params.topics.join(", ");
  const typesText = params.questionTypes.join(" and ");
  const difficultiesText = params.difficultyLevels.join(", ");

  return await generateBatch({
    subject: params.subject,
    topicsText,
    typesText,
    difficultiesText,
    shortCount: params.shortCount,
    longCount: params.longCount,
    mode,
    requestId: params.requestId,
  });
}
