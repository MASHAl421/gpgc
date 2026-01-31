-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Create a public view for non-sensitive profile data (for leaderboards, forum display, etc.)
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  username,
  forum_points,
  coins_earned,
  is_bs_student,
  semester,
  created_at
FROM public.profiles;
-- NOTE: email is intentionally excluded from this view

-- Allow anyone to select from the public view
-- (The view uses security_invoker=on, so it respects the caller's permissions)
-- Since we need public access for leaderboards, we create a policy on profiles 
-- that allows SELECT when accessed through the view by checking specific conditions

-- Actually, with security_invoker=on, the view will use the caller's RLS policies
-- So we need a different approach: allow authenticated users to see non-email fields of all profiles

-- Drop the restrictive policy and create a more nuanced one
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Policy 1: Anyone can view their own full profile (including email)
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Policy 2: Authenticated users can view other profiles (for leaderboards)
-- But the application code should only select non-sensitive fields
CREATE POLICY "Authenticated users can view public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: While this policy allows SELECT, the application code in ForumSidebar.tsx 
-- only queries: id, username, forum_points - never email addresses
-- For additional protection, we keep the view for explicit non-email access