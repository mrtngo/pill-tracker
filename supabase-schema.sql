-- Create subscriptions table for storing PWA push subscription credentials
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  subscription_json JSONB NOT NULL,
  reminder_time TEXT NOT NULL,          -- local time format 'HH:MM' (e.g. '21:00')
  timezone_offset INTEGER NOT NULL,     -- new Date().getTimezoneOffset() (e.g. 300 for UTC-5)
  pill_name TEXT NOT NULL,              -- name of the pill to include in notifications
  last_notified_date TEXT,              -- local date format 'YYYY-MM-DD' to prevent double alerts
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security) if desired, but for this simple app's service key / serverless function usage, we can write a simple schema.
-- Index for quick queries by cron job
CREATE INDEX IF NOT EXISTS idx_subscriptions_reminder ON subscriptions (reminder_time);
