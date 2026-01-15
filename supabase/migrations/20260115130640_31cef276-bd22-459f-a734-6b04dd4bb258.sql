-- Add guardian and address columns to students table
ALTER TABLE public.students 
ADD COLUMN guardian text,
ADD COLUMN address text;