-- Enable RLS for all flagged tables to prevent unauthorized client access
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;

-- The categories table is queried from the client-side (e.g., inventory page) 
-- so it requires a policy to allow public reads.
DROP POLICY IF EXISTS "Allow public read on categories" ON public.categories;
CREATE POLICY "Allow public read on categories"
  ON public.categories
  FOR SELECT
  USING (true);

-- The remaining 5 tables (admin_sessions, login_attempts, audit_logs, 
-- system_settings, outbox_events) are exclusively accessed server-side 
-- via `supabaseAdmin` (Service Role Key). Because the Service Role key 
-- bypasses RLS entirely, we do not need to create any policies for them. 
-- Enabling RLS with 0 policies effectively denies all Anon/Authenticated 
-- access, which is the most secure posture for backend-only tables.
