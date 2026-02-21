
-- ============================================
-- NEP 2020 Compliance: Database Schema Changes
-- ============================================

-- 1. Create enum for NEP learning stages (5+3+3+4 structure)
CREATE TYPE public.nep_learning_stage AS ENUM (
  'foundational',   -- Ages 3-8, Pre-school to Grade 2
  'preparatory',    -- Ages 8-11, Grades 3-5
  'middle',         -- Ages 11-14, Grades 6-8
  'secondary'       -- Ages 14-18, Grades 9-12
);

-- 2. Create enum for assessment domains (cognitive/affective/psychomotor)
CREATE TYPE public.assessment_domain AS ENUM (
  'cognitive',      -- Knowledge, understanding, analysis, critical thinking
  'affective',      -- Attitudes, values, social-emotional skills
  'psychomotor'     -- Physical skills, coordination, practical abilities
);

-- 3. Create enum for assessment category (formative vs summative)
CREATE TYPE public.assessment_category AS ENUM (
  'formative',      -- Ongoing, regular assessments (quizzes, classwork, observations)
  'summative'       -- End-of-term/year evaluations (exams, finals)
);

-- 4. Create enum for subject types (academic + co-curricular)
CREATE TYPE public.subject_type AS ENUM (
  'academic',       -- Traditional subjects (Math, Science, etc.)
  'co_curricular',  -- Sports, Arts, Music, etc.
  'vocational'      -- Skill-based/vocational training
);

-- 5. Create enum for co-curricular grading
CREATE TYPE public.grade_scale AS ENUM (
  'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'E'
);

-- ============================================
-- Table Modifications
-- ============================================

-- 6. Add learning_stage to subjects table (auto-derive from class mapping)
ALTER TABLE public.subjects 
  ADD COLUMN subject_type public.subject_type NOT NULL DEFAULT 'academic';

-- 7. Add assessment_domain and assessment_category to assessments table
ALTER TABLE public.assessments
  ADD COLUMN assessment_domain public.assessment_domain NOT NULL DEFAULT 'cognitive',
  ADD COLUMN assessment_category public.assessment_category NOT NULL DEFAULT 'summative';

-- 8. Add qualitative feedback fields to student_marks
ALTER TABLE public.student_marks
  ADD COLUMN grade public.grade_scale,
  ADD COLUMN qualitative_feedback text,
  ADD COLUMN is_grade_based boolean NOT NULL DEFAULT false;

-- ============================================
-- NEP Stage Mapping Function
-- ============================================

-- 9. Function to derive NEP stage from class_name
CREATE OR REPLACE FUNCTION public.get_nep_stage(class_name text)
RETURNS public.nep_learning_stage
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  grade_num integer;
  cleaned text;
BEGIN
  IF class_name IS NULL THEN
    RETURN NULL;
  END IF;
  
  cleaned := lower(trim(class_name));
  
  -- Handle pre-school / nursery / LKG / UKG
  IF cleaned IN ('pre-school', 'preschool', 'nursery', 'lkg', 'ukg', 'kg', 'kindergarten', 'pre-primary') THEN
    RETURN 'foundational';
  END IF;
  
  -- Extract numeric grade
  grade_num := (regexp_match(cleaned, '(\d+)'))[1]::integer;
  
  IF grade_num IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF grade_num <= 2 THEN
    RETURN 'foundational';
  ELSIF grade_num <= 5 THEN
    RETURN 'preparatory';
  ELSIF grade_num <= 8 THEN
    RETURN 'middle';
  ELSIF grade_num <= 12 THEN
    RETURN 'secondary';
  ELSE
    RETURN NULL;
  END IF;
END;
$$;
