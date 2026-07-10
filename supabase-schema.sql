-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Devices / Settings table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY,
  pill_name TEXT NOT NULL DEFAULT 'Pastilla Diaria',
  reminder_time TEXT NOT NULL DEFAULT '21:00',
  start_date TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'cyan',
  push_message TEXT NOT NULL DEFAULT 'No olvides registrar tu hábito de hoy. Toca para registrar.',
  unlocked_collectibles JSONB NOT NULL DEFAULT '{}'::jsonb,
  visible_collectibles JSONB NOT NULL DEFAULT '{}'::jsonb,
  unlocked_themes JSONB NOT NULL DEFAULT '{}'::jsonb,
  tokens INTEGER NOT NULL DEFAULT 50,
  total_tokens INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Push Subscriptions linked to devices
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  subscription_json JSONB NOT NULL,
  timezone_offset INTEGER NOT NULL,
  last_notified_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Dose Logs table
CREATE TABLE IF NOT EXISTS pill_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL, -- format 'YYYY-MM-DD'
  status TEXT NOT NULL,   -- 'taken', 'skipped'
  logged_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(device_id, log_date)
);

-- 4. Custom Messages table
CREATE TABLE IF NOT EXISTS custom_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_device ON subscriptions (device_id);
CREATE INDEX IF NOT EXISTS idx_pill_logs_device ON pill_logs (device_id);
CREATE INDEX IF NOT EXISTS idx_custom_messages_device ON custom_messages (device_id);

-- 5. Request Logs table
CREATE TABLE IF NOT EXISTS request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  device_type TEXT,
  os_name TEXT,
  browser_name TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  latitude TEXT,
  longitude TEXT,
  is_pwa BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_device ON request_logs (device_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs (created_at);
create table if not exists game_saves (
  device_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

