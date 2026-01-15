-- Fee Status Enum
CREATE TYPE public.fee_status AS ENUM ('upcoming', 'due', 'overdue', 'paid');

-- Schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  upi_id TEXT,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- School admins table (links auth.users to schools)
CREATE TABLE public.school_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_id)
);

-- Academic years table
CREATE TABLE public.academic_years (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  roll_number TEXT,
  class_name TEXT,
  section TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  access_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student academic year enrollment
CREATE TABLE public.student_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_name TEXT,
  section TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, academic_year_id)
);

-- Fee categories table (customizable per school)
CREATE TABLE public.fee_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fee structures (fee amount per category per academic year)
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  fee_category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(academic_year_id, fee_category_id)
);

-- Installments (payment schedule)
CREATE TABLE public.installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student fee assignments (assigns fee structures to students)
CREATE TABLE public.student_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, fee_structure_id)
);

-- Payment records
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  installment_id UUID NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode TEXT,
  reference_number TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's school IDs
CREATE OR REPLACE FUNCTION public.get_user_school_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.school_admins WHERE user_id = auth.uid()
$$;

-- Helper function to check if user is admin of a school
CREATE OR REPLACE FUNCTION public.is_school_admin(_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_admins
    WHERE user_id = auth.uid() AND school_id = _school_id
  )
$$;

-- RLS Policies for schools
CREATE POLICY "Admins can view their schools"
ON public.schools FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "Admins can update their schools"
ON public.schools FOR UPDATE
TO authenticated
USING (id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "Authenticated users can create schools"
ON public.schools FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for school_admins
CREATE POLICY "Admins can view school admins of their schools"
ON public.school_admins FOR SELECT
TO authenticated
USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "Admins can manage school admins of their schools"
ON public.school_admins FOR INSERT
TO authenticated
WITH CHECK (school_id IN (SELECT public.get_user_school_ids()) OR user_id = auth.uid());

CREATE POLICY "Admins can delete school admins of their schools"
ON public.school_admins FOR DELETE
TO authenticated
USING (school_id IN (SELECT public.get_user_school_ids()));

-- RLS Policies for academic_years
CREATE POLICY "Admins can view academic years of their schools"
ON public.academic_years FOR SELECT
TO authenticated
USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "Admins can manage academic years of their schools"
ON public.academic_years FOR ALL
TO authenticated
USING (school_id IN (SELECT public.get_user_school_ids()));

-- RLS Policies for students (both admin and public access via token)
CREATE POLICY "Admins can view students of their schools"
ON public.students FOR SELECT
TO authenticated
USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "Admins can manage students of their schools"
ON public.students FOR ALL
TO authenticated
USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "Public can view student by access token"
ON public.students FOR SELECT
TO anon
USING (true);

-- RLS Policies for student_enrollments
CREATE POLICY "Admins can view enrollments of their school students"
ON public.student_enrollments FOR SELECT
TO authenticated
USING (student_id IN (SELECT id FROM public.students WHERE school_id IN (SELECT public.get_user_school_ids())));

CREATE POLICY "Admins can manage enrollments of their school students"
ON public.student_enrollments FOR ALL
TO authenticated
USING (student_id IN (SELECT id FROM public.students WHERE school_id IN (SELECT public.get_user_school_ids())));

CREATE POLICY "Public can view enrollments by student"
ON public.student_enrollments FOR SELECT
TO anon
USING (true);

-- RLS Policies for fee_categories
CREATE POLICY "Admins can view fee categories of their schools"
ON public.fee_categories FOR SELECT
TO authenticated
USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "Admins can manage fee categories of their schools"
ON public.fee_categories FOR ALL
TO authenticated
USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "Public can view fee categories"
ON public.fee_categories FOR SELECT
TO anon
USING (true);

-- RLS Policies for fee_structures
CREATE POLICY "Admins can view fee structures of their schools"
ON public.fee_structures FOR SELECT
TO authenticated
USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "Admins can manage fee structures of their schools"
ON public.fee_structures FOR ALL
TO authenticated
USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "Public can view fee structures"
ON public.fee_structures FOR SELECT
TO anon
USING (true);

-- RLS Policies for installments
CREATE POLICY "Admins can view installments of their schools"
ON public.installments FOR SELECT
TO authenticated
USING (fee_structure_id IN (SELECT id FROM public.fee_structures WHERE school_id IN (SELECT public.get_user_school_ids())));

CREATE POLICY "Admins can manage installments of their schools"
ON public.installments FOR ALL
TO authenticated
USING (fee_structure_id IN (SELECT id FROM public.fee_structures WHERE school_id IN (SELECT public.get_user_school_ids())));

CREATE POLICY "Public can view installments"
ON public.installments FOR SELECT
TO anon
USING (true);

-- RLS Policies for student_fees
CREATE POLICY "Admins can view student fees of their schools"
ON public.student_fees FOR SELECT
TO authenticated
USING (student_id IN (SELECT id FROM public.students WHERE school_id IN (SELECT public.get_user_school_ids())));

CREATE POLICY "Admins can manage student fees of their schools"
ON public.student_fees FOR ALL
TO authenticated
USING (student_id IN (SELECT id FROM public.students WHERE school_id IN (SELECT public.get_user_school_ids())));

CREATE POLICY "Public can view student fees"
ON public.student_fees FOR SELECT
TO anon
USING (true);

-- RLS Policies for payments
CREATE POLICY "Admins can view payments of their schools"
ON public.payments FOR SELECT
TO authenticated
USING (student_id IN (SELECT id FROM public.students WHERE school_id IN (SELECT public.get_user_school_ids())));

CREATE POLICY "Admins can manage payments of their schools"
ON public.payments FOR ALL
TO authenticated
USING (student_id IN (SELECT id FROM public.students WHERE school_id IN (SELECT public.get_user_school_ids())));

CREATE POLICY "Public can view payments"
ON public.payments FOR SELECT
TO anon
USING (true);

-- Schools readable by anon for parent view
CREATE POLICY "Public can view schools"
ON public.schools FOR SELECT
TO anon
USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON public.academic_years FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fee_categories_updated_at BEFORE UPDATE ON public.fee_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fee_structures_updated_at BEFORE UPDATE ON public.fee_structures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON public.installments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_school_admins_user_id ON public.school_admins(user_id);
CREATE INDEX idx_school_admins_school_id ON public.school_admins(school_id);
CREATE INDEX idx_students_school_id ON public.students(school_id);
CREATE INDEX idx_students_access_token ON public.students(access_token);
CREATE INDEX idx_academic_years_school_id ON public.academic_years(school_id);
CREATE INDEX idx_fee_categories_school_id ON public.fee_categories(school_id);
CREATE INDEX idx_fee_structures_school_id ON public.fee_structures(school_id);
CREATE INDEX idx_installments_fee_structure_id ON public.installments(fee_structure_id);
CREATE INDEX idx_payments_student_id ON public.payments(student_id);
CREATE INDEX idx_payments_installment_id ON public.payments(installment_id);