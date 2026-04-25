-- =========================================================================
-- Fr. Pimen Calendar — production hardening migration
-- Run in Supabase SQL editor.
-- =========================================================================

-- 1. Push notifications table
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  keys_p256dh text not null,
  keys_auth text not null,
  created_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own push subs" on public.push_subscriptions;
create policy "Users manage own push subs" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Performance indexes
create index if not exists events_owner_starts_idx on public.events(owner_id, starts_at);
create index if not exists events_owner_ends_idx   on public.events(owner_id, ends_at);
create index if not exists tasks_owner_status_idx  on public.tasks(owner_id, status);
create index if not exists tasks_owner_due_idx     on public.tasks(owner_id, due_at);
create index if not exists shares_owner_idx        on public.calendar_shares(owner_id);
create index if not exists shares_email_idx        on public.calendar_shares(shared_with_email);
create index if not exists chat_owner_created_idx  on public.chat_messages(owner_id, created_at);
create index if not exists attendees_email_idx     on public.event_attendees(email);
create index if not exists attendees_event_idx     on public.event_attendees(event_id);

-- 3. RLS audit (re-apply tight policies — idempotent)
alter table public.events enable row level security;
alter table public.tasks  enable row level security;
alter table public.profiles enable row level security;
alter table public.meeting_types enable row level security;
alter table public.event_attendees enable row level security;
alter table public.chat_messages enable row level security;

-- 4. Cleanup old push subscriptions (>180 days inactive)
-- Run manually or via cron if needed.
-- delete from push_subscriptions where created_at < now() - interval '180 days';
