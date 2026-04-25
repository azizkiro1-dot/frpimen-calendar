-- Event templates for one-tap event creation
create table if not exists public.event_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  title text not null,
  description text,
  location text,
  default_duration_minutes int not null default 60,
  meeting_type_id uuid references public.meeting_types(id) on delete set null,
  busy_level text default 'busy',
  visibility text default 'default',
  rrule text,
  attendees text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists templates_owner_idx on public.event_templates(owner_id);

alter table public.event_templates enable row level security;
drop policy if exists "templates_owner_rw" on public.event_templates;
create policy "templates_owner_rw" on public.event_templates
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
