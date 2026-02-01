import { supabase } from "@/integrations/supabase/client";

export interface SubjectiveQuestion {
  id: string;
  question: string;
  answer: string;
  type: "short" | "long";
  category: "exercise" | "conceptual";
  difficulty: "easy" | "medium" | "hard";
}

type GenerateParams = {
  subject: string;
  topics: string[];
  shortCount: number;
  longCount: number;
  questionTypes: string[];
  difficultyLevels: string[];
};

// Must match backend per-request limits (supabase/functions/generate-subjective-questions/_shared/types.ts)
const CALL_MAX_SHORT = 35;
const CALL_MAX_LONG = 8;
const CALL_MAX_TOTAL = 40;

export async function generateSubjectiveQuestionsBatched(
  params: GenerateParams,
): Promise<SubjectiveQuestion[]> {
  const requestIdBase = globalThis.crypto?.randomUUID?.() ?? String(Date.now());

  let remainingShort = Math.max(0, Math.floor(params.shortCount));
  let remainingLong = Math.max(0, Math.floor(params.longCount));
  const all: SubjectiveQuestion[] = [];

  let batchIndex = 0;
  while (remainingShort > 0 || remainingLong > 0) {
    batchIndex += 1;

    const batchLong = Math.min(remainingLong, CALL_MAX_LONG);
    const capacityForShort = Math.max(0, CALL_MAX_TOTAL - batchLong);
    const batchShort = Math.min(remainingShort, CALL_MAX_SHORT, capacityForShort);

    if (batchShort === 0 && batchLong === 0) break;

    const { data, error } = await supabase.functions.invoke(
      "generate-subjective-questions",
      {
        body: {
          subject: params.subject,
          topics: params.topics,
          shortCount: batchShort,
          longCount: batchLong,
          questionTypes: params.questionTypes,
          difficultyLevels: params.difficultyLevels,
          requestId: `${requestIdBase}-${batchIndex}`,
        },
      },
    );

    if (error) throw new Error(error.message || "Failed to generate questions");
    if (data?.success === false) throw new Error(data?.error || "Failed to generate questions");

    const questions = (data?.questions ?? []) as SubjectiveQuestion[];
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("No questions were generated");
    }

    all.push(...questions);
    remainingShort -= batchShort;
    remainingLong -= batchLong;
  }

  return all;
}
