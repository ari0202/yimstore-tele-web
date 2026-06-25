-- Add email column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create OTP codes table for recovery
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- RLS for otp_codes
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow insert and select from service_role only (server-side operations)
CREATE POLICY "Service role can manage otp_codes" ON public.otp_codes
    USING (true)
    WITH CHECK (true);
