-- Create payment_settings table
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    bank_name TEXT,
    account_number TEXT,
    account_holder TEXT,
    branch TEXT,
    qr_type TEXT DEFAULT 'static' NOT NULL,
    attach_qr_to_message BOOLEAN DEFAULT true NOT NULL,
    allowed_staff_ids UUID[] DEFAULT '{}'::uuid[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all actions for authenticated users on payment_settings"
ON public.payment_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
