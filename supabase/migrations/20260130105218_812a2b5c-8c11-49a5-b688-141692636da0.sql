-- Add question_type column to questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'conceptual';

-- Add difficulty column to questions table (for question-level difficulty)
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium';

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);