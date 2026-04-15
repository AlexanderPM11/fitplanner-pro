-- Add user_id to exercises to support custom user exercises
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add video and gender support
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS gender text;

-- Policy update: Users can manage their own exercises
CREATE POLICY "Users can manage their own exercises." ON public.exercises
  FOR ALL USING (auth.uid() = user_id);
