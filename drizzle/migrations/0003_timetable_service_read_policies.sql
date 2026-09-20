-- Tenant-scoped read policies for the least-privilege timetable_service role.
-- Additive: no existing policy is altered or dropped.

-- helper so the service never needs a SELECT grant on public.students
CREATE OR REPLACE FUNCTION public.timetable_enrollment_in_ctx(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = _student_id
      AND s.school_id = public.timetable_ctx_school()
  )
$$;
GRANT EXECUTE ON FUNCTION public.timetable_enrollment_in_ctx(uuid) TO timetable_service;

CREATE POLICY schools_timetable_service_read ON public.schools
  FOR SELECT TO timetable_service
  USING (id = public.timetable_ctx_school());

CREATE POLICY academic_years_timetable_service_read ON public.academic_years
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school());

CREATE POLICY school_teachers_timetable_service_read ON public.school_teachers
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school());

CREATE POLICY subjects_timetable_service_read ON public.subjects
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school());

CREATE POLICY subject_class_assignments_timetable_service_read ON public.subject_class_assignments
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school());

CREATE POLICY teacher_subject_assignments_timetable_service_read ON public.teacher_subject_assignments
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school());

CREATE POLICY teacher_class_assignments_timetable_service_read ON public.teacher_class_assignments
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school());

CREATE POLICY student_enrollments_timetable_service_read ON public.student_enrollments
  FOR SELECT TO timetable_service
  USING (public.timetable_enrollment_in_ctx(student_id));
