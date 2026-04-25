'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Scope = 'occurrence' | 'future' | 'series'

export async function deleteRecurring(eventId: string, scope: Scope, occurrenceDate?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: event } = await supabase
    .from('events').select('*').eq('id', eventId).eq('owner_id', user.id).single()
  if (!event) return { error: 'not found' }

  if (!event.rrule || scope === 'series') {
    await supabase.from('events').delete().eq('id', eventId).eq('owner_id', user.id)
    revalidatePath('/')
    return { success: true }
  }

  if (scope === 'future' && occurrenceDate) {
    // Add UNTIL to rrule, ending series before this occurrence
    const until = new Date(occurrenceDate)
    until.setUTCDate(until.getUTCDate() - 1)
    const untilStr = until.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const newRrule = event.rrule.includes('UNTIL=')
      ? event.rrule.replace(/UNTIL=[^;]+/, `UNTIL=${untilStr}`)
      : `${event.rrule};UNTIL=${untilStr}`
    await supabase.from('events').update({ rrule: newRrule }).eq('id', eventId).eq('owner_id', user.id)
    revalidatePath('/')
    return { success: true }
  }

  if (scope === 'occurrence' && occurrenceDate) {
    // Append EXDATE to rrule
    const exdate = new Date(occurrenceDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const newRrule = event.rrule.includes('EXDATE=')
      ? event.rrule.replace(/EXDATE=([^;]*)/, (_m: string, list: string) => `EXDATE=${list},${exdate}`)
      : `${event.rrule};EXDATE=${exdate}`
    await supabase.from('events').update({ rrule: newRrule }).eq('id', eventId).eq('owner_id', user.id)
    revalidatePath('/')
    return { success: true }
  }

  return { error: 'invalid request' }
}
