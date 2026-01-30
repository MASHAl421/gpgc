-- Forum Points System: Track points earned through forum activities
-- Add forum_points column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS forum_points INTEGER DEFAULT 0;

-- Create forum_badges table for badge definitions
CREATE TABLE IF NOT EXISTS public.forum_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Award',
  required_points INTEGER NOT NULL,
  required_answers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on forum_badges
ALTER TABLE public.forum_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can view badges
CREATE POLICY "Anyone can view forum badges"
  ON public.forum_badges
  FOR SELECT
  USING (true);

-- Only admins can manage badges
CREATE POLICY "Admins can manage forum badges"
  ON public.forum_badges
  FOR ALL
  USING (is_admin(auth.uid()));

-- Create forum_point_transactions table to track point history
CREATE TABLE IF NOT EXISTS public.forum_point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'signup', 'new_post', 'new_reply', 'question_upvote', 'best_answer', 'referral'
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_point_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their point transactions"
  ON public.forum_point_transactions
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own transactions
CREATE POLICY "Users can insert their point transactions"
  ON public.forum_point_transactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Create user_forum_badges junction table
CREATE TABLE IF NOT EXISTS public.user_forum_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.forum_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_forum_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can view earned badges
CREATE POLICY "Anyone can view user forum badges"
  ON public.user_forum_badges
  FOR SELECT
  USING (true);

-- Users can earn badges
CREATE POLICY "Users can earn forum badges"
  ON public.user_forum_badges
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Insert default badge definitions based on the PDF
INSERT INTO public.forum_badges (name, description, icon, required_points, required_answers) VALUES
  ('Beginner', 'Starting your journey in the forum community', 'BookOpen', 50, 10),
  ('Teacher', 'Helping others learn and grow', 'GraduationCap', 100, 50),
  ('Pundit', 'A recognized expert in discussions', 'Brain', 150, 100),
  ('Explainer', 'Master at explaining complex topics', 'Lightbulb', 200, 150),
  ('Professional', 'A true professional contributor', 'Briefcase', 250, 200),
  ('Enlightened', 'The highest honor in the community', 'Crown', 300, 250);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_forum_point_transactions_user_id ON public.forum_point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_point_transactions_created_at ON public.forum_point_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_forum_badges_user_id ON public.user_forum_badges(user_id);