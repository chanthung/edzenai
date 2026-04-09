ALTER TABLE public.attendance 
ADD COLUMN subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;