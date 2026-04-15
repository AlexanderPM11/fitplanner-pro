-- Add enriched data columns for EDB-v2 support
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS instructions JSONB,
ADD COLUMN IF NOT EXISTS tips JSONB,
ADD COLUMN IF NOT EXISTS difficulty TEXT,
ADD COLUMN IF NOT EXISTS male_activation_url TEXT,
ADD COLUMN IF NOT EXISTS female_activation_url TEXT;

-- Add Unique Constraint to enable UPSERT/Synchronization by name and user
ALTER TABLE public.exercises 
ADD CONSTRAINT exercises_name_user_id_key UNIQUE (name, user_id);

-- Add is_template to workouts to distinguish between routines and sessions
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false;
