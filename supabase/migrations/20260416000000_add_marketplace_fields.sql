-- Extend exercises table for Marketplace capabilities
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS equipment TEXT;

ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS movement_type TEXT;

-- Create favorite exercises table
CREATE TABLE IF NOT EXISTS public.favorite_exercises (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, exercise_id)
);

-- Set up RLS for the new table
ALTER TABLE public.favorite_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorite_exercises"
    ON public.favorite_exercises FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite_exercises"
    ON public.favorite_exercises FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite_exercises"
    ON public.favorite_exercises FOR DELETE
    USING (auth.uid() = user_id);
