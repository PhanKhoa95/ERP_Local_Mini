
CREATE TABLE public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  note_type text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  follow_up_date timestamptz,
  is_resolved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read customer_notes"
  ON public.customer_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert customer_notes"
  ON public.customer_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update customer_notes"
  ON public.customer_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete customer_notes"
  ON public.customer_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
