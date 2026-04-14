-- Add image_url to exercises
ALTER TABLE public.exercises ADD COLUMN image_url text;

-- Insert bucket for exercise images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercises', 'exercises', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for the exercises bucket
-- 1. Anyone can view exercise images (since global exercises should have public images)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'exercises' );

-- 2. Authenticated users can insert images (for their custom exercises)
CREATE POLICY "Authenticated users can upload objects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exercises'
);

-- 3. Users can only update/delete their own uploads
CREATE POLICY "Users can delete their own objects"
ON storage.objects FOR DELETE
TO authenticated
USING ( 
  bucket_id = 'exercises' AND 
  auth.uid() = owner 
);
