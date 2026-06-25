-- Add QRIS string and payment expiration columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS qris_string TEXT,
ADD COLUMN IF NOT EXISTS payment_expired_at TIMESTAMPTZ;

-- Allow these columns in our Row Level Security policies (no change needed as policies use auth/insert patterns)
