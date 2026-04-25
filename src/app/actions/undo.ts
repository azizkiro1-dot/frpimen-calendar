'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function restoreEvent(payload: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  // Strip relational fields, keep only columns
  const { meeting_types, ...row } = payload
  const { error } = await supabase.from('events').insert({ ...row, owner_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}

export async function restoreTask(payload: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('tasks').insert({ ...payload, owner_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}
