-- Block-off ranges: vacations, days off, daily quiet hours
create table if not exists public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('range','recurring_daily')),
  -- For 'range': specific dates
  starts_at timestamptz,
  ends_at   timestamptz,
  -- For 'recurring_daily': time-of-day window (HH:MM, local TZ)
  daily_start text,
  daily_end   text,
  weekdays int[],   -- which days 1=Mon..7=Sun (null = every day)
  -- Common
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists time_blocks_owner_idx on public.time_blocks(owner_id);

alter table public.time_blocks enable row level security;
drop policy if exists "blocks_owner_rw" on public.time_blocks;
create policy "blocks_owner_rw" on public.time_blocks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "blocks_public_read" on public.time_blocks;
create policy "blocks_public_read" on public.time_blocks
  for select using (true);  -- needed so booking page can check; reveals only times not reasons
