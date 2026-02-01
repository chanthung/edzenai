-- Add class_name column to subjects table
ALTER TABLE public.subjects ADD COLUMN class_name text NULL;

-- Add index for filtering by school_id and class_name
CREATE INDEX idx_subjects_school_class ON public.subjects (school_id, class_name);

-- Add partial unique index to prevent duplicate subject names within a class
CREATE UNIQUE INDEX idx_subjects_unique_per_class 
ON public.subjects (school_id, class_name, name) 
WHERE class_name IS NOT NULL;