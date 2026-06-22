-- supabase/migrations/20260622120003_pg_cron_abandoned_holds.sql

-- Pastikan extension pg_cron aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Jadwalkan pelepasan inventory yang di hold namun belum dibayar (lewat 15 menit)
SELECT cron.schedule(
  'release-abandoned-holds', 
  '* * * * *', 
  $$
    UPDATE public.inventory 
    SET status = 'Available', reserved_until = NULL 
    WHERE status = 'Hold' AND reserved_until < NOW();
  $$
);
