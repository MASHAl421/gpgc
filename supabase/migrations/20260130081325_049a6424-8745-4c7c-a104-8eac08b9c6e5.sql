-- Create table to track user upvotes for forum posts
CREATE TABLE public.forum_post_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create table to track user upvotes for forum replies
CREATE TABLE public.forum_reply_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reply_id UUID NOT NULL REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reply_id)
);

-- Enable RLS
ALTER TABLE public.forum_post_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reply_upvotes ENABLE ROW LEVEL SECURITY;

-- RLS policies for forum_post_upvotes
CREATE POLICY "Users can view all post upvotes" 
ON public.forum_post_upvotes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own post upvotes" 
ON public.forum_post_upvotes 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own post upvotes" 
ON public.forum_post_upvotes 
FOR DELETE 
USING (user_id = auth.uid());

-- RLS policies for forum_reply_upvotes
CREATE POLICY "Users can view all reply upvotes" 
ON public.forum_reply_upvotes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own reply upvotes" 
ON public.forum_reply_upvotes 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reply upvotes" 
ON public.forum_reply_upvotes 
FOR DELETE 
USING (user_id = auth.uid());