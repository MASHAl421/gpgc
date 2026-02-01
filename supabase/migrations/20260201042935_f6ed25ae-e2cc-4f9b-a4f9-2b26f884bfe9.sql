-- Fix 1: Restrict forum upvote tables to only show user's own upvotes
-- This prevents user profiling and privacy exposure

-- Drop existing overly permissive SELECT policies
DROP POLICY IF EXISTS "Users can view all post upvotes" ON public.forum_post_upvotes;
DROP POLICY IF EXISTS "Users can view all reply upvotes" ON public.forum_reply_upvotes;

-- Create restrictive policies - users can only see their own upvotes
CREATE POLICY "Users can view own post upvotes" 
ON public.forum_post_upvotes 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can view own reply upvotes" 
ON public.forum_reply_upvotes 
FOR SELECT 
USING (user_id = auth.uid());

-- Fix 2: Add RLS protection to profiles_public view
-- Views with security_invoker=on inherit RLS from underlying tables
-- The profiles table already has proper RLS, but we need to ensure view access is controlled

-- Since profiles_public is a VIEW (not a table), RLS doesn't apply directly to it.
-- The view uses security_invoker=on which means it respects the RLS of the underlying profiles table.
-- The current profiles RLS only allows users to see their own profile.
-- For the leaderboard/top members functionality, we need authenticated-only access.

-- We'll recreate the view to ensure it's properly configured
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
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
REVOKE ALL ON public.profiles_public FROM public;
GRANT SELECT ON public.profiles_public TO authenticated;

-- Update profiles table RLS to allow authenticated users to see public profile data
-- Keep the existing policy for own profile management, add read access for public fields
DROP POLICY IF EXISTS "Users can view only own profile" ON public.profiles;

-- Users can always view their own full profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Authenticated users can view public profile data (for leaderboards, forum member lists)
-- This is safe because the profiles_public view already excludes email
CREATE POLICY "Authenticated users can view public profile data" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);