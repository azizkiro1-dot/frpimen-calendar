-- Replace auth.users subqueries with auth.jwt() (no extra grants needed)

drop policy if exists "events_shared_read" on public.events;
create policy "events_shared_read" on public.events
  for select using (
    exists (
      select 1 from public.calendar_shares cs
      where cs.owner_id = events.owner_id
        and cs.shared_with_email = (auth.jwt() ->> 'email')
        and cs.revoked_at is null
    )
  );

drop policy if exists "shares_recipient_read" on public.calendar_shares;
create policy "shares_recipient_read" on public.calendar_shares
  for select using (shared_with_email = (auth.jwt() ->> 'email'));

drop policy if exists "attendees_self_read" on public.event_attendees;
create policy "attendees_self_read" on public.event_attendees
  for select using (email = (auth.jwt() ->> 'email'));

drop policy if exists "attendees_self_update" on public.event_attendees;
create policy "attendees_self_update" on public.event_attendees
  for update using (email = (auth.jwt() ->> 'email'));
