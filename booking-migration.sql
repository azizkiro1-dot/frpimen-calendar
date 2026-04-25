-- Booking links: parishioners pick a slot from a public page
create table if not exists public.booking_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  duration_minutes int not null default 30,
  location text,
  meeting_type_id uuid references public.meeting_types(id) on delete set null,
  availability_days int[] default array[1,2,3,4,5,6,7]::int[],   -- 1=Mon..7=Sun
  availability_start text default '09:00',                        -- 24h HH:MM
  availability_end   text default '17:00',
  buffer_before_minutes int default 0,
  buffer_after_minutes  int default 15,
  max_per_day int,
  active boolean default true,
  created_at timestamptz not null default now()
);
create index if not exists booking_links_owner_idx on public.booking_links(owner_id);
create index if not exists booking_links_slug_idx  on public.booking_links(slug);

alter table public.booking_links enable row level security;
drop policy if exists "booking_owner_rw" on public.booking_links;
create policy "booking_owner_rw" on public.booking_links
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Public read for the slug-based booking page
drop policy if exists "booking_public_read" on public.booking_links;
create policy "booking_public_read" on public.booking_links
  for select using (active = true);

-- Default location on profile
alter table public.profiles add column if not exists default_location text;
alter table public.profiles add column if not exists recent_locations text[] default array[]::text[];
