-- PRECAUCIÓN: Este comando borrará TODOS los ejercicios locales
-- Si tienes ejercicios asociados a rutinas, esto ELIMINARÁ también esos ejercicios de tus rutinas (Cascade Delete).
-- Ejecuta este script desde el SQL Editor de tu Dashboard de Supabase.

DELETE FROM public.exercises;

-- Añadimos la columna api_id para poder relacionar el ejercicio local con la API de Videos
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS api_id text;
