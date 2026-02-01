export type Difficulty = "easy" | "medium" | "hard";
export type Category = "exercise" | "conceptual";

export const LIMITS = {
  maxSubjectLen: 200,
  maxTopicLen: 100,
  maxTopics: 50,

  // UI caps (mirrored in frontend UI)
  uiMaxShort: 80,
  uiMaxLong: 40,
  uiMaxTotal: 100,

  // Per-call caps (frontend will auto-batch for large papers)
  callMaxShort: 35,
  callMaxLong: 8,
  callMaxTotal: 40,

  // Default batch sizes (large papers may use bigger batches in code)
  // (kept for backwards compatibility; frontend batching is now preferred)
  shortBatch: 20,
  longBatch: 5,

  // AI robustness
  maxParseRetries: 2,
  maxRateLimitRetries: 2,
} as const;

export interface QuestionRequest {
  subject: string;
  topics: string[];
  shortCount?: number;
  longCount?: number;
  questionTypes?: string[];
  difficultyLevels?: string[];
}

export interface AIQuestion {
  id?: string;
  question: string;
  answer: string;
  type?: "short" | "long";
  category?: Category;
  difficulty?: Difficulty;
}

export interface AIResponse {
  questions: AIQuestion[];
}

export interface SubjectiveQuestion {
  id: string;
  question: string;
  answer: string;
  type: "short" | "long";
  category: Category;
  difficulty: Difficulty;
}
