-- Function to evaluate and grant achievements based on user stats
CREATE OR REPLACE FUNCTION public.check_and_grant_achievements(_user_id uuid)
RETURNS TABLE(achievement_id uuid, name text, coins_reward integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ach RECORD;
  user_stat INTEGER;
  granted_id uuid;
BEGIN
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Can only check your own achievements';
  END IF;

  FOR ach IN
    SELECT a.id, a.name, a.coins_reward, a.achievement_type, a.requirement_value
    FROM achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = _user_id AND ua.achievement_id = a.id
    )
  LOOP
    user_stat := 0;

    IF ach.achievement_type = 'quiz' THEN
      SELECT COUNT(*) INTO user_stat FROM quiz_attempts WHERE user_id = _user_id;
    ELSIF ach.achievement_type = 'score' THEN
      -- Perfect score: any quiz where score = total_questions
      SELECT COALESCE(MAX(CASE WHEN total_questions > 0 THEN (score * 100 / total_questions) ELSE 0 END), 0)
        INTO user_stat FROM quiz_attempts WHERE user_id = _user_id;
    ELSIF ach.achievement_type = 'streak' THEN
      SELECT COALESCE(MAX(streak_count), 0) INTO user_stat FROM daily_logins WHERE user_id = _user_id;
    ELSIF ach.achievement_type = 'competition' THEN
      SELECT COUNT(*) INTO user_stat FROM competition_attempts WHERE user_id = _user_id;
    END IF;

    IF user_stat >= ach.requirement_value THEN
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (_user_id, ach.id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING
      RETURNING achievement_id INTO granted_id;

      IF granted_id IS NOT NULL THEN
        -- Award coins for the achievement
        UPDATE profiles
        SET coins_earned = COALESCE(coins_earned, 0) + ach.coins_reward
        WHERE id = _user_id;

        INSERT INTO coin_transactions (user_id, amount, transaction_type, description, reference_id)
        VALUES (_user_id, ach.coins_reward, 'achievement', 'Achievement: ' || ach.name, ach.id);

        achievement_id := ach.id;
        name := ach.name;
        coins_reward := ach.coins_reward;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;

  RETURN;
END;
$$;