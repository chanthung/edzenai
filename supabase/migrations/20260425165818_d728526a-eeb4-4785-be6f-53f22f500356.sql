
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  doc_type text NOT NULL DEFAULT 'report_card',
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  paper_size text NOT NULL DEFAULT 'A4',
  orientation text NOT NULL DEFAULT 'portrait',
  margins jsonb NOT NULL DEFAULT '{"top":15,"right":15,"bottom":15,"left":15}'::jsonb,
  elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_templates_school ON public.document_templates(school_id, doc_type);
CREATE UNIQUE INDEX idx_document_templates_one_default
  ON public.document_templates(school_id, doc_type)
  WHERE is_default = true;

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage their school document templates"
  ON public.document_templates
  FOR ALL
  TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT get_user_school_ids()));

CREATE POLICY "Teachers view their school document templates"
  ON public.document_templates
  FOR SELECT
  TO authenticated
  USING (school_id IN (SELECT get_teacher_school_ids()));

CREATE POLICY "Service role manages document templates"
  ON public.document_templates
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
