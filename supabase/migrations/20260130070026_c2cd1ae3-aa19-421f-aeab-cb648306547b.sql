-- =============================================
-- COMPETITION SYSTEM TABLES
-- =============================================

-- Scheduled competitions (weekly/monthly)
CREATE TABLE public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    competition_type TEXT NOT NULL DEFAULT 'weekly' CHECK (competition_type IN ('weekly', 'monthly', 'special')),
    semester INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Competition entries (which topics/quizzes are included)
CREATE TABLE public.competition_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(competition_id, topic_id)
);

-- Competition attempts by users
CREATE TABLE public.competition_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    time_taken_seconds INTEGER,
    coins_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(competition_id, user_id)
);

-- =============================================
-- COINS & REWARDS SYSTEM
-- =============================================

-- Coin transactions log
CREATE TABLE public.coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('quiz_reward', 'daily_login', 'achievement', 'competition', 'spent')),
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Daily login tracking
CREATE TABLE public.daily_logins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    login_date DATE NOT NULL DEFAULT CURRENT_DATE,
    streak_count INTEGER DEFAULT 1,
    coins_earned INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, login_date)
);

-- Achievements/Badges
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Award',
    coins_reward INTEGER DEFAULT 10,
    achievement_type TEXT NOT NULL CHECK (achievement_type IN ('quiz', 'streak', 'score', 'competition', 'special')),
    requirement_value INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User achievements
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- Reward shop items
CREATE TABLE public.shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    coin_cost INTEGER NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('theme', 'avatar', 'feature', 'certificate')),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User purchases
CREATE TABLE public.user_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    shop_item_id UUID REFERENCES public.shop_items(id) ON DELETE CASCADE NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, shop_item_id)
);

-- =============================================
-- FORUM SYSTEM
-- =============================================

-- Forum posts
CREATE TABLE public.forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    upvotes INTEGER DEFAULT 0,
    is_answered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Forum replies
CREATE TABLE public.forum_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_accepted_answer BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- ENABLE RLS
-- =============================================

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Competitions - public read, admin write
CREATE POLICY "Anyone can view competitions" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "Admins can manage competitions" ON public.competitions FOR ALL USING (is_admin(auth.uid()));

-- Competition topics - public read
CREATE POLICY "Anyone can view competition topics" ON public.competition_topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage competition topics" ON public.competition_topics FOR ALL USING (is_admin(auth.uid()));

-- Competition attempts - users can view/insert their own
CREATE POLICY "Users can view their attempts" ON public.competition_attempts FOR SELECT USING (user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Users can insert their attempts" ON public.competition_attempts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their attempts" ON public.competition_attempts FOR UPDATE USING (user_id = auth.uid());

-- Coin transactions - users view their own
CREATE POLICY "Users can view their transactions" ON public.coin_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert transactions" ON public.coin_transactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Daily logins - users manage their own
CREATE POLICY "Users can view their logins" ON public.daily_logins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their logins" ON public.daily_logins FOR INSERT WITH CHECK (user_id = auth.uid());

-- Achievements - public read
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (is_admin(auth.uid()));

-- User achievements
CREATE POLICY "Users can view their achievements" ON public.user_achievements FOR SELECT USING (user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "System can grant achievements" ON public.user_achievements FOR INSERT WITH CHECK (user_id = auth.uid());

-- Shop items - public read
CREATE POLICY "Anyone can view shop items" ON public.shop_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage shop items" ON public.shop_items FOR ALL USING (is_admin(auth.uid()));

-- User purchases
CREATE POLICY "Users can view their purchases" ON public.user_purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can make purchases" ON public.user_purchases FOR INSERT WITH CHECK (user_id = auth.uid());

-- Forum posts - public read, auth create
CREATE POLICY "Anyone can view forum posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their posts" ON public.forum_posts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their posts" ON public.forum_posts FOR DELETE USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Forum replies
CREATE POLICY "Anyone can view replies" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their replies" ON public.forum_replies FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their replies" ON public.forum_replies FOR DELETE USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- =============================================
-- INSERT DEFAULT ACHIEVEMENTS
-- =============================================

INSERT INTO public.achievements (name, description, icon, coins_reward, achievement_type, requirement_value) VALUES
('First Steps', 'Complete your first quiz', 'Trophy', 10, 'quiz', 1),
('Quiz Master', 'Complete 10 quizzes', 'Medal', 50, 'quiz', 10),
('Perfect Score', 'Get 100% on any quiz', 'Star', 25, 'score', 100),
('Week Warrior', 'Login for 7 consecutive days', 'Flame', 35, 'streak', 7),
('Month Champion', 'Login for 30 consecutive days', 'Crown', 100, 'streak', 30),
('Competition Winner', 'Win a weekly competition', 'Award', 75, 'competition', 1),
('Rising Star', 'Reach top 10 in leaderboard', 'TrendingUp', 50, 'competition', 10);

-- =============================================
-- INSERT DEFAULT SHOP ITEMS
-- =============================================

INSERT INTO public.shop_items (name, description, coin_cost, item_type) VALUES
('Dark Theme', 'Unlock the dark theme for better night studying', 50, 'theme'),
('Golden Avatar Frame', 'A prestigious golden frame for your profile', 100, 'avatar'),
('Certificate of Excellence', 'Downloadable certificate for your achievements', 200, 'certificate'),
('Ad-Free Experience', 'Remove all distractions for focused study', 150, 'feature');