-- Fix email exposure: Drop the permissive policy and keep only own-profile access
-- The profiles_public view already handles public leaderboard queries without email

DROP POLICY IF EXISTS "Authenticated users can view public profile fields" ON public.profiles;

-- Ensure only the own-profile policy exists
-- (Already created: "Users can view only own profile" with id = auth.uid())

-- Revoke direct table access and grant view access for public data
-- This ensures even malicious clients cannot query emails directly
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;