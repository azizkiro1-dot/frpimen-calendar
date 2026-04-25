'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function cancelAttendee(id: string, sig: string) {
  const secret = process.env.CANCEL_SECRET ?? process.env.CRON_SECRET ?? 'fallback-rotate'
  const sb = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: attendee } = await sb
    .from('event_attendees')
    .select('id, event_id, email, name, canceled_at')
    .eq('id', id)
    .single()
  if (!attendee) return { error: 'not found' }

  const expected = crypto.createHmac('sha256', secret).update(`${attendee.id}:${attendee.event_id}`).digest('hex').slice(0, 32)
  if (sig !== expected) return { error: 'invalid signature' }
  if (attendee.canceled_at) return { error: 'already cancelled' }

  // Mark cancelled + delete the event (since this was a 1-on-1 booking)
  await sb.from('event_attendees').update({ canceled_at: new Date().toISOString(), rsvp_status: 'declined' }).eq('id', id)
  await sb.from('events').delete().eq('id', attendee.event_id)

  // Notify priest
  try {
    const { sendEmail } = await import('@/lib/email/send')
    const { data: event } = await sb.from('events').select('starts_at, title, owner_id').eq('id', attendee.event_id).single()
    if (event) {
      const { data: { user: ownerUser } } = await sb.auth.admin.getUserById(event.owner_id)
      if (ownerUser?.email) {
        await sendEmail(
          ownerUser.email,
          `Cancelled: ${event.title}`,
          `<div style="font-family:system-ui,sans-serif;padding:24px"><p>${attendee.name ?? attendee.email} cancelled their booking.</p></div>`
        )
      }
    }
  } catch {}

  return { success: true }
}
