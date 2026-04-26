'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type MType = { name: string; color: string; category?: string; default_duration_minutes?: number }

export async function createMeetingType(t: MType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('meeting_types').insert({
    owner_id: user.id,
    name: t.name,
    color: t.color,
    category: t.category ?? 'other',
    default_duration_minutes: t.default_duration_minutes ?? 60,
  })
  if (error) return { error: error.message }
  revalidatePath('/meeting-types'); revalidatePath('/')
  return { success: true }
}

export async function updateMeetingType(id: string, t: MType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('meeting_types').update({
    name: t.name,
    color: t.color,
    default_duration_minutes: t.default_duration_minutes ?? 60,
  }).eq('id', id).eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/meeting-types'); revalidatePath('/')
  return { success: true }
}

export async function deleteMeetingType(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('meeting_types').delete().eq('id', id).eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/meeting-types'); revalidatePath('/')
  return { success: true }
}
