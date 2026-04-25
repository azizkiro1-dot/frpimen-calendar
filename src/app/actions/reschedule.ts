'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function rescheduleEvent(id: string, startsAt: string, endsAt: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase
    .from('events')
    .update({ starts_at: startsAt, ends_at: endsAt })
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}
