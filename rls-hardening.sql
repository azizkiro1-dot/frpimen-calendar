-- =========================================================================
-- Fr. Pimen Calendar — RLS hardening
-- Run after supabase-migrations.sql. Idempotent.
-- =========================================================================

-- Enable RLS on every user table
alter table public.profiles         enable row level security;
alter table public.events           enable row level security;
alter table public.tasks            enable row level security;
alter table public.meeting_types    enable row level security;
alter table public.calendar_shares  enable row level security;
alter table public.event_attendees  enable row level security;
alter table public.chat_messages    enable row level security;
alter table public.push_subscriptions enable row level security;

-- profiles: each user reads/writes only their own row
drop policy if exists "profiles_self_rw" on public.profiles;
create policy "profiles_self_rw" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- events: owner full access; shared viewers read-only based on calendar_shares
drop policy if exists "events_owner_rw" on public.events;
create policy "events_owner_rw" on public.events
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "events_shared_read" on public.events;
create policy "events_shared_read" on public.events
  for select using (
    exists (
      select 1 from public.calendar_shares cs
      where cs.owner_id = events.owner_id
        and cs.shared_with_email = (select email from auth.users where id = auth.uid())
        and cs.revoked_at is null
    )
  );

-- tasks: owner only
drop policy if exists "tasks_owner_rw" on public.tasks;
create policy "tasks_owner_rw" on public.tasks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- meeting_types: owner only
drop policy if exists "meeting_types_owner_rw" on public.meeting_types;
create policy "meeting_types_owner_rw" on public.meeting_types
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- calendar_shares: owner manages own shares; shared user can read their own row
drop policy if exists "shares_owner_rw" on public.calendar_shares;
create policy "shares_owner_rw" on public.calendar_shares
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "shares_recipient_read" on public.calendar_shares;
create policy "shares_recipient_read" on public.calendar_shares
  for select using (
    shared_with_email = (select email from auth.users where id = auth.uid())
  );

-- event_attendees: event owner full access; attendee can read+update own row
drop policy if exists "attendees_owner_rw" on public.event_attendees;
create policy "attendees_owner_rw" on public.event_attendees
  for all using (
    exists (select 1 from public.events e where e.id = event_attendees.event_id and e.owner_id = auth.uid())
  );

drop policy if exists "attendees_self_read" on public.event_attendees;
create policy "attendees_self_read" on public.event_attendees
  for select using (
    email = (select email from auth.users where id = auth.uid())
  );

drop policy if exists "attendees_self_update" on public.event_attendees;
create policy "attendees_self_update" on public.event_attendees
  for update using (
    email = (select email from auth.users where id = auth.uid())
  );

-- chat_messages: owner only
drop policy if exists "chat_owner_rw" on public.chat_messages;
create policy "chat_owner_rw" on public.chat_messages
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- push_subscriptions: owner only
drop policy if exists "push_subs_owner_rw" on public.push_subscriptions;
create policy "push_subs_owner_rw" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Confirm policies are active
select tablename, policyname from pg_policies
where schemaname = 'public'
order by tablename, policyname;
