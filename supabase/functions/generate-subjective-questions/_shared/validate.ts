import { LIMITS, type Category, type Difficulty } from "./types.ts";

function sanitizeText(input: string, maxLen: number) {
  // Keep letters/numbers/basic punctuation commonly used in Pakistani course titles.
  return input.replace(/[^a-zA-Z0-9\s\-\+\(\)\.,:&]/g, "").slice(0, maxLen).trim();
}

export function sanitizeSubject(subject: unknown) {
  if (!subject || typeof subject !== "string") {
    throw new Error("Invalid request: subject is required");
  }
  const s = sanitizeText(subject, LIMITS.maxSubjectLen);
  if (!s) throw new Error("Invalid subject");
  return s;
}

export function sanitizeTopics(topics: unknown) {
  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error("Invalid request: topics must be a non-empty array");
  }
  if (topics.length > LIMITS.maxTopics) {
    throw new Error(`Too many topics: maximum ${LIMITS.maxTopics} allowed`);
  }
  const sanitized = topics
    .filter((t) => typeof t === "string")
    .map((t) => sanitizeText(t, LIMITS.maxTopicLen))
    .filter((t) => t.length > 0);
  if (sanitized.length === 0) throw new Error("No valid topics provided");
  return sanitized;
}

export function validateCounts(shortCount: unknown, longCount: unknown) {
  const short = Math.max(0, Math.floor(Number(shortCount ?? 5) || 0));
  const long = Math.max(0, Math.floor(Number(longCount ?? 3) || 0));
  const total = short + long;

  if (total <= 0) throw new Error("Please request at least 1 question.");

  if (short > LIMITS.callMaxShort) {
    throw new Error(
      `This request is too large for one generation (max short per request: ${LIMITS.callMaxShort}).`,
    );
  }
  if (long > LIMITS.callMaxLong) {
    throw new Error(
      `This request is too large for one generation (max long per request: ${LIMITS.callMaxLong}).`,
    );
  }
  if (total > LIMITS.callMaxTotal) {
    throw new Error(
      `This request is too large for one generation (max total per request: ${LIMITS.callMaxTotal}).`,
    );
  }

  return { short, long, total };
}

export function validateQuestionTypes(questionTypes: unknown): Category[] {
  const valid: Category[] = ["exercise", "conceptual"];
  const selected = (Array.isArray(questionTypes) ? questionTypes : []).filter((t) =>
    valid.includes(t as Category)
  ) as Category[];
  return selected.length ? selected : valid;
}

export function validateDifficultyLevels(difficultyLevels: unknown): Difficulty[] {
  const valid: Difficulty[] = ["easy", "medium", "hard"];
  const selected = (Array.isArray(difficultyLevels) ? difficultyLevels : []).filter((d) =>
    valid.includes(d as Difficulty)
  ) as Difficulty[];
  return selected.length ? selected : valid;
}
