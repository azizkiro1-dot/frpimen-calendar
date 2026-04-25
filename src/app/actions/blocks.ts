'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function listBlocks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('time_blocks').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
  return data ?? []
}

export async function createRangeBlock(startsAt: string, endsAt: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('time_blocks').insert({
    owner_id: user.id,
    kind: 'range',
    starts_at: startsAt,
    ends_at: endsAt,
    reason: reason ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath('/blocks')
  return { success: true }
}

export async function createDailyBlock(dailyStart: string, dailyEnd: string, weekdays?: number[], reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('time_blocks').insert({
    owner_id: user.id,
    kind: 'recurring_daily',
    daily_start: dailyStart,
    daily_end: dailyEnd,
    weekdays: weekdays ?? null,
    reason: reason ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath('/blocks')
  return { success: true }
}

export async function deleteBlock(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('time_blocks').delete().eq('id', id).eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/blocks')
  return { success: true }
}
