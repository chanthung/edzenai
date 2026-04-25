SELECT cron.unschedule('daily-fee-reminders');

SELECT cron.schedule(
  'hourly-fee-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://fwnvfkaihuqdfdcwkakj.supabase.co/functions/v1/send-fee-reminders',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bnZma2FpaHVxZGZkY3drYWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NjAyNDUsImV4cCI6MjA4NDAzNjI0NX0.ACHP7ZbpKLiJJhL05Es1vmL3ltMAXk64CpbdkbtsxGc"}'::jsonb,
    body:=concat('{"time":"', now(), '"}')::jsonb
  );
  $$
);