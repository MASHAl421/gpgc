-- Drop both policies we just created
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view public profile fields" ON public.profiles;

-- Create a single policy: users can ONLY view their own profile
CREATE POLICY "Users can view only own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());