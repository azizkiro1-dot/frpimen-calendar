'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setRsvp(eventId: string, status: 'accepted' | 'declined' | 'tentative' | 'pending') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('event_attendees')
    .update({ rsvp_status: status, responded_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('email', user.email)

  if (error) return { error: error.message }
  revalidatePath('/rsvp')
  return { success: true }
}
