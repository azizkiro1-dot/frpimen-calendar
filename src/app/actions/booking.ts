'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { DateTime } from 'luxon'

const TZ = 'America/Chicago'

type BookingLink = {
  name: string
  slug: string
  description?: string
  duration_minutes: number
  location?: string
  meeting_type_id?: string | null
  availability_days?: number[]
  availability_start?: string
  availability_end?: string
  buffer_before_minutes?: number
  buffer_after_minutes?: number
  max_per_day?: number | null
}

export async function createBookingLink(input: BookingLink) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const slug = (input.slug || input.name).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  const { data, error } = await supabase.from('booking_links').insert({
    owner_id: user.id,
    slug,
    name: input.name,
    description: input.description ?? null,
    duration_minutes: input.duration_minutes,
    location: input.location ?? null,
    meeting_type_id: input.meeting_type_id ?? null,
    availability_days: input.availability_days ?? [1,2,3,4,5,6,7],
    availability_start: input.availability_start ?? '09:00',
    availability_end: input.availability_end ?? '17:00',
    buffer_before_minutes: input.buffer_before_minutes ?? 0,
    buffer_after_minutes: input.buffer_after_minutes ?? 15,
    max_per_day: input.max_per_day ?? null,
  }).select().single()
  if (error) return { error: error.message }
  revalidatePath('/booking-links')
  return { success: true, link: data }
}

export async function deleteBookingLink(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('booking_links').delete().eq('id', id).eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/booking-links')
  return { success: true }
}

// PUBLIC: returns available slots for a given date
export async function getAvailableSlots(slug: string, dateStr: string): Promise<string[]> {
  const sb = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: link } = await sb.from('booking_links').select('*').eq('slug', slug).eq('active', true).single()
  if (!link) return []

  const day = DateTime.fromISO(dateStr, { zone: TZ })
  const weekday = day.weekday  // 1=Mon..7=Sun
  if (!link.availability_days?.includes(weekday)) return []

  const [sH, sM] = link.availability_start.split(':').map(Number)
  const [eH, eM] = link.availability_end.split(':').map(Number)
  const dayStart = day.set({ hour: sH, minute: sM, second: 0, millisecond: 0 })
  const dayEnd = day.set({ hour: eH, minute: eM, second: 0, millisecond: 0 })

  // Fetch existing events for this day
  const { data: existing } = await sb.from('events')
    .select('starts_at, ends_at')
    .eq('owner_id', link.owner_id)
    .gte('starts_at', dayStart.toUTC().toISO()!)
    .lt('starts_at', dayEnd.plus({ hours: 24 }).toUTC().toISO()!)

  // Fetch blocks for this day
  const { data: rangeBlocks } = await sb.from('time_blocks')
    .select('starts_at, ends_at')
    .eq('owner_id', link.owner_id).eq('kind', 'range')
    .gte('ends_at', dayStart.toUTC().toISO()!)
    .lt('starts_at', dayEnd.plus({ hours: 24 }).toUTC().toISO()!)

  const { data: dailyBlocks } = await sb.from('time_blocks')
    .select('daily_start, daily_end, weekdays')
    .eq('owner_id', link.owner_id).eq('kind', 'recurring_daily')

  const blockedRanges: { start: DateTime; end: DateTime }[] = []
  for (const r of rangeBlocks ?? []) {
    blockedRanges.push({
      start: DateTime.fromISO(r.starts_at, { zone: 'utc' }),
      end: DateTime.fromISO(r.ends_at, { zone: 'utc' }),
    })
  }
  for (const d of dailyBlocks ?? []) {
    if (d.weekdays && Array.isArray(d.weekdays) && !d.weekdays.includes(weekday)) continue
    if (!d.daily_start || !d.daily_end) continue
    const [dsH, dsM] = d.daily_start.split(':').map(Number)
    const [deH, deM] = d.daily_end.split(':').map(Number)
    blockedRanges.push({
      start: day.set({ hour: dsH, minute: dsM, second: 0 }).toUTC(),
      end: day.set({ hour: deH, minute: deM, second: 0 }).toUTC(),
    })
  }

  const slots: string[] = []
  const step = link.duration_minutes + (link.buffer_after_minutes ?? 0)
  let cursor = dayStart

  // Don't offer slots in the past
  const now = DateTime.now().setZone(TZ)
  if (cursor < now) cursor = now.set({ minute: Math.ceil(now.minute / 15) * 15, second: 0, millisecond: 0 })

  while (cursor.plus({ minutes: link.duration_minutes }) <= dayEnd) {
    const slotStart = cursor
    const slotEnd = cursor.plus({ minutes: link.duration_minutes })
    const conflicts = (existing ?? []).some((e: any) => {
      const eS = DateTime.fromISO(e.starts_at, { zone: 'utc' })
      const eE = DateTime.fromISO(e.ends_at, { zone: 'utc' })
      return eS < slotEnd.toUTC() && eE > slotStart.toUTC()
    }) || blockedRanges.some(b => b.start < slotEnd.toUTC() && b.end > slotStart.toUTC())
    if (!conflicts) slots.push(slotStart.toFormat('HH:mm'))
    cursor = cursor.plus({ minutes: step })
  }

  // Cap by max_per_day if set
  if (link.max_per_day) {
    const sameDayBookings = (existing ?? []).filter((e: any) => {
      const eS = DateTime.fromISO(e.starts_at, { zone: 'utc' }).setZone(TZ)
      return eS.hasSame(day, 'day')
    }).length
    const remaining = Math.max(0, link.max_per_day - sameDayBookings)
    return slots.slice(0, remaining)
  }
  return slots
}

// PUBLIC: book a slot
export async function bookSlot(slug: string, dateStr: string, time: string, name: string, email: string, notes?: string) {
  const sb = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: link } = await sb.from('booking_links').select('*').eq('slug', slug).eq('active', true).single()
  if (!link) return { error: 'Link not found' }

  // Re-verify slot still available
  const slots = await getAvailableSlots(slug, dateStr)
  if (!slots.includes(time)) return { error: 'Slot no longer available' }

  const start = DateTime.fromISO(`${dateStr}T${time}`, { zone: TZ })
  const end = start.plus({ minutes: link.duration_minutes })

  const { data: event, error } = await sb.from('events').insert({
    owner_id: link.owner_id,
    title: `${link.name} — ${name}`,
    description: notes ? `Booked via ${link.slug}\n\n${notes}` : `Booked via ${link.slug}`,
    location: link.location,
    starts_at: start.toUTC().toISO(),
    ends_at: end.toUTC().toISO(),
    all_day: false,
    meeting_type_id: link.meeting_type_id,
    busy_level: 'busy',
    visibility: 'default',
  }).select().single()

  if (error) return { error: error.message }

  // Add the booker as attendee
  await sb.from('event_attendees').insert({
    event_id: event.id,
    email,
    rsvp_status: 'accepted',
    name,
  })

  return { success: true, eventId: event.id }
}
