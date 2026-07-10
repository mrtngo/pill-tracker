create table if not exists public.game_saves (
  device_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_game_saves_updated_at
  on public.game_saves (updated_at desc);
