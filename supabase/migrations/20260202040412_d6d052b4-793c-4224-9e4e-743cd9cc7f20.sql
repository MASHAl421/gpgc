-- ==============================================================
-- FIX 1: Restrict email exposure in profiles table
-- ==============================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON public.profiles;

-- Create a new policy that shows all non-sensitive data to authenticated users
-- but restricts email to profile owner only
-- We'll use the existing profiles_public view for public data access

-- ==============================================================
-- FIX 2: Create atomic forum points function (like add_coins)
-- ==============================================================

CREATE OR REPLACE FUNCTION public.add_forum_points(
  _user_id UUID,
  _points INTEGER,
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
  -- Validate user is adding points to their own account
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Can only add forum points to your own account';
  END IF;

  -- Validate points is positive
  IF _points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive';
  END IF;

  -- Atomically update forum_points with implicit row lock
  UPDATE profiles 
  SET forum_points = COALESCE(forum_points, 0) + _points
  WHERE id = _user_id
  RETURNING forum_points INTO new_balance;

  -- Log the transaction
  INSERT INTO forum_point_transactions (user_id, points, transaction_type, description, reference_id)
  VALUES (_user_id, _points, _transaction_type, _description, _reference_id);

  RETURN new_balance;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_forum_points TO authenticated;

-- ==============================================================
-- FIX 3: Restrict notification creation to require actor = auth.uid()
-- ==============================================================

-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a proper policy that requires actor_id to be the current user
CREATE POLICY "Users can create notifications as actor"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow creating notifications where you are the actor
  actor_id = auth.uid()
  -- Prevent self-notifications
  AND user_id != auth.uid()
);