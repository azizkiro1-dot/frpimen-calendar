'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addShare(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = formData.get('email')?.toString().trim().toLowerCase()
  const access_level = formData.get('access_level')?.toString() || 'see_busy'
  const can_see_confidential = formData.get('can_see_confidential') === 'on'

  if (!email) return { error: 'Email required' }
  if (!/\S+@\S+\.\S+/.test(email)) return { error: 'Invalid email format' }

  const { data: existing } = await supabase
    .from('calendar_shares')
    .select('id')
    .eq('owner_id', user.id)
    .eq('shared_with_email', email)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('calendar_shares')
      .update({ access_level, can_see_confidential, revoked_at: null })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('calendar_shares').insert({
      owner_id: user.id,
      shared_with_email: email,
      access_level,
      can_see_confidential,
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/sharing')
  return { success: true }
}

export async function revokeShare(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('calendar_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/sharing')
  return { success: true }
}

export async function restoreShare(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('calendar_shares')
    .update({ revoked_at: null })
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/sharing')
  return { success: true }
}

export async function deleteShare(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('calendar_shares')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/sharing')
  return { success: true }
}