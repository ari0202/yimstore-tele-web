-- Pastikan extension pg_cron aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Jadwalkan fungsi cleanup berjalan setiap menit
SELECT cron.schedule(
  'auto-cleanup-orders',         -- nama job
  '* * * * *',                   -- setiap menit
  'SELECT system_periodic_cleanup();'
);
