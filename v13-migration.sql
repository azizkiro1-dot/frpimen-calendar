-- Branding config on profile
alter table public.profiles add column if not exists church_name  text;
alter table public.profiles add column if not exists logo_url     text;
alter table public.profiles add column if not exists brand_color  text;

-- Phone on attendees
alter table public.event_attendees add column if not exists phone text;
alter table public.event_attendees add column if not exists name  text;
alter table public.event_attendees add column if not exists notes text;

-- Cancel tokens (signed via HMAC at runtime — no DB needed; this column for audit)
alter table public.event_attendees add column if not exists canceled_at timestamptz;
