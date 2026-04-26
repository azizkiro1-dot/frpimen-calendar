'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  starts_at: z.string(),
  ends_at: z.string(),
  all_day: z.boolean().default(false),
  meeting_type_id: z.string().uuid().optional().nullable(),
  busy_level: z.enum(['free','tentative','busy','blocked']).default('busy'),
  visibility: z.enum(['default','private','confidential','public']).default('default'),
  rrule: z.string().optional().nullable(),
  attendee_emails: z.string().optional(),
  recurrence: z.enum(['none','daily','weekly','monthly']).default('none'),
  recurrence_count: z.number().int().min(1).max(365).optional(),
})

function parseFormData(formData: FormData) {
  return {
    title: formData.get('title')?.toString() ?? '',
    description: formData.get('description')?.toString() || undefined,
    location: formData.get('location')?.toString() || undefined,
    starts_at: new Date(formData.get('starts_at')?.toString() ?? '').toISOString(),
    ends_at: new Date(formData.get('ends_at')?.toString() ?? '').toISOString(),
    all_day: formData.get('all_day') === 'on',
    meeting_type_id: formData.get('meeting_type_id')?.toString() || null,
    busy_level: (formData.get('busy_level')?.toString() as any) ?? 'busy',
    visibility: (formData.get('visibility')?.toString() as any) ?? 'default',
    rrule: formData.get('rrule')?.toString() || null,
    attendee_emails: formData.get('attendee_emails')?.toString() || undefined,
    recurrence: (formData.get('recurrence')?.toString() as any) ?? 'none',
    recurrence_count: formData.get('recurrence_count')
      ? parseInt(formData.get('recurrence_count')!.toString())
      : undefined,
  }
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = eventSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  const data = parsed.data

  let recurrence_rule: string | null = null
  if (data.recurrence !== 'none') {
    const freq = data.recurrence.toUpperCase()
    const count = data.recurrence_count ?? 10
    recurrence_rule = `FREQ=${freq};COUNT=${count}`
  }

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      owner_id: user.id,
      title: data.title,
      description: data.description,
      location: data.location,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      all_day: data.all_day,
      meeting_type_id: data.meeting_type_id,
      busy_level: data.busy_level,
      visibility: data.visibility,
      rrule: data.rrule,
      recurrence_rule,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  if (data.attendee_emails && event) {
    const emails = data.attendee_emails
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0)
    if (emails.length > 0) {
      await supabase.from('event_attendees').insert(
        emails.map((email) => ({ event_id: event.id, email, rsvp_status: 'pending' }))
      )
      await sendInviteEmails(event.id, user.email ?? null, emails)
    }
  }

  revalidatePath('/')
  return { success: true, eventId: event?.id }
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const raw = parseFormData(formData)
  const { error } = await supabase
    .from('events')
    .update({
      title: raw.title,
      description: raw.description,
      location: raw.location,
      starts_at: raw.starts_at,
      ends_at: raw.ends_at,
      all_day: raw.all_day,
      meeting_type_id: raw.meeting_type_id,
      busy_level: raw.busy_level,
      visibility: raw.visibility,
      rrule: raw.rrule,
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  await notifyAttendees(id, 'updated')
  revalidatePath('/')
  return { success: true }
}

export async function deleteEvent(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await notifyAttendees(id, 'cancelled')
  const { error } = await supabase.from('events').delete().eq('id', id).eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

async function notifyAttendees(eventId: string, type: 'updated' | 'cancelled', context?: any) {
  try {
    const { createClient: createService } = await import('@supabase/supabase-js')
    const sb = createService(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: attendees } = await sb.from('event_attendees').select('email, name').eq('event_id', eventId)
    if (!attendees?.length) return
    const { data: event } = await sb.from('events').select('title, starts_at, ends_at, location, owner_id').eq('id', eventId).single()
    if (!event) return
    const { sendEmail } = await import('@/lib/email/send')
    const subject = type === 'cancelled' ? `Cancelled: ${event.title}` : `Updated: ${event.title}`
    const body = `<div style="font-family:system-ui,sans-serif;padding:24px;max-width:520px;margin:0 auto"><h2>${subject}</h2><p style="color:#525252">${type === 'cancelled' ? 'This event has been cancelled.' : 'The event details have changed.'}</p><div style="background:#f5f5f5;border-radius:14px;padding:16px;margin:16px 0"><div style="font-weight:600">${event.title}</div><div style="color:#525252;margin-top:4px">${new Date(event.starts_at).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'full', timeStyle: 'short' })}</div>${event.location ? `<div style="color:#525252;margin-top:4px">📍 ${event.location}</div>` : ''}</div></div>`
    const { data: { user: ownerUser } } = await sb.auth.admin.getUserById(event.owner_id ?? '')
    for (const a of attendees) {
      await sendEmail(a.email, subject, body, { replyTo: ownerUser?.email ?? undefined }).catch(() => {})
    }
  } catch (e) { console.error('notify attendees failed', e) }
}


async function sendInviteEmails(eventId: string, ownerEmail: string | null, attendeeEmails: string[]) {
  if (!attendeeEmails.length) return
  try {
    const { createClient: createService } = await import('@supabase/supabase-js')
    const sb = createService(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: event } = await sb.from('events').select('title, starts_at, ends_at, location, description').eq('id', eventId).single()
    if (!event) return
    const { sendEmail } = await import('@/lib/email/send')
    const dt = new Date(event.starts_at).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'full', timeStyle: 'short' })
    const subject = `Invite: ${event.title}`
    const body = `<div style="font-family:system-ui,sans-serif;padding:24px;max-width:520px;margin:0 auto"><h2>${event.title}</h2><div style="background:#f5f5f5;border-radius:14px;padding:16px;margin:16px 0"><div style="color:#525252">${dt}</div>${event.location ? `<div style="color:#525252;margin-top:4px">📍 ${event.location}</div>` : ''}</div>${event.description ? `<p style="color:#525252;font-size:13px">${event.description}</p>` : ''}<p style="color:#737373;font-size:12px">This invitation was sent on behalf of Fr. Pimen.</p></div>`
    for (const email of attendeeEmails) {
      await sendEmail(email, subject, body, { replyTo: ownerEmail ?? undefined }).catch(() => {})
    }
  } catch (e) { console.error('sendInviteEmails failed', e) }
}
