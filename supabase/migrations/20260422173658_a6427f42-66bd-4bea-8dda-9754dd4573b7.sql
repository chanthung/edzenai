ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS default_classes text[],
ADD COLUMN IF NOT EXISTS default_sections text[];