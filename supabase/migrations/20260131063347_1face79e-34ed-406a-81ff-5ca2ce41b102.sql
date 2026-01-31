-- Create atomic function to add coins (prevents race conditions)
CREATE OR REPLACE FUNCTION public.add_coins(
  _user_id UUID,
  _amount INTEGER,
  _transaction_type TEXT,
  _description TEXT DEFAULT NULL,
  _reference_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Validate user is adding coins to their own account
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Can only add coins to your own account';
  END IF;

  -- Validate amount is positive
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Atomically update coins with row lock
  UPDATE profiles 
  SET coins_earned = COALESCE(coins_earned, 0) + _amount
  WHERE id = _user_id
  RETURNING coins_earned INTO new_balance;

  -- Log the transaction
  INSERT INTO coin_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (_user_id, _amount, _transaction_type, _description, _reference_id);

  RETURN new_balance;
END;
$$;

-- Create atomic function to spend coins (prevents race conditions and double-spending)
CREATE OR REPLACE FUNCTION public.spend_coins(
  _user_id UUID,
  _amount INTEGER,
  _description TEXT,
  _reference_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_coins INTEGER;
  new_balance INTEGER;
BEGIN
  -- Validate user is spending their own coins
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Can only spend your own coins';
  END IF;

  -- Validate amount is positive
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Lock row and get current balance
  SELECT coins_earned INTO current_coins
  FROM profiles
  WHERE id = _user_id
  FOR UPDATE;

  -- Check sufficient balance
  IF COALESCE(current_coins, 0) < _amount THEN
    RAISE EXCEPTION 'Insufficient coins. You have % coins but need %.', COALESCE(current_coins, 0), _amount;
  END IF;

  -- Atomically deduct coins
  UPDATE profiles 
  SET coins_earned = coins_earned - _amount
  WHERE id = _user_id
  RETURNING coins_earned INTO new_balance;

  -- Log the transaction (negative amount for spending)
  INSERT INTO coin_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (_user_id, -_amount, 'spent', _description, _reference_id);

  RETURN new_balance;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.add_coins TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_coins TO authenticated;

-- Restrict forum posts and replies to authenticated users only (fixing public exposure)
DROP POLICY IF EXISTS "Anyone can view forum posts" ON public.forum_posts;
CREATE POLICY "Authenticated users can view forum posts" 
ON public.forum_posts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view replies" ON public.forum_replies;
CREATE POLICY "Authenticated users can view replies" 
ON public.forum_replies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add RLS to profiles_public view - recreate as a secure view
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS 
SELECT 
  id,
  username,
  coins_earned,
  forum_points,
  semester,
  is_bs_student,
  created_at
FROM public.profiles;

-- Grant SELECT on the view to authenticated users only
REVOKE ALL ON public.profiles_public FROM anon;
GRANT SELECT ON public.profiles_public TO authenticated;