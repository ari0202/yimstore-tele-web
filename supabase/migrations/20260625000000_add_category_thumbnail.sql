ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
