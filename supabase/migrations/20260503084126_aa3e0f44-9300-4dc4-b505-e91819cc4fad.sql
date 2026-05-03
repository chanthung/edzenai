ALTER TABLE public.fee_structures
ADD COLUMN generation_type text NOT NULL DEFAULT 'manual';