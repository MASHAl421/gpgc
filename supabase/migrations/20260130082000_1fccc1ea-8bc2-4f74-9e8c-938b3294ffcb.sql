-- Drop overly permissive insert policy
DROP POLICY "System can insert notifications" ON public.notifications;

-- Create more restrictive insert policy - only authenticated users can create notifications
CREATE POLICY "Authenticated users can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);