'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { refreshGoogleToken, listGoogleEvents } from '@/lib/google/calendar'

export async function syncGoogleCalendar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('google_refresh_token')
    .eq('id', user.id)
    .single()

  if (!profile?.google_refresh_token) {
    return { error: 'Google not connected. Sign out and sign in again to authorize calendar access.' }
  }

  let access_token: string
  let expires_in: number
  try {
    const res = await refreshGoogleToken(profile.google_refresh_token)
    access_token = res.access_token
    expires_in = res.expires_in
  } catch (e: any) {
    return { error: `Token refresh failed. Sign out + sign in again. (${e.message})` }
  }

  await supabase
    .from('profiles')
    .update({
      google_access_token: access_token,
      google_token_expires_at: new Date(Date.now() + (expires_in - 60) * 1000).toISOString(),
    })
    .eq('id', user.id)

  const now = new Date()
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString()
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 0).toISOString()

  let events
  try {
    events = await listGoogleEvents(access_token, timeMin, timeMax)
  } catch (e: any) {
    return { error: e.message }
  }

  const { data: defaultType } = await supabase
    .from('meeting_types')
    .select('id')
    .eq('owner_id', user.id)
    .eq('name', 'Other')
    .single()

  const rows = events
    .filter((ev) => ev.start && ev.end)
    .map((ev) => ({
      owner_id: user.id,
      google_event_id: ev.id,
      title: ev.summary ?? 'Untitled',
      description: ev.description ?? null,
      location: ev.location ?? null,
      starts_at: ev.start.dateTime ?? ev.start.date ?? null,
      ends_at: ev.end.dateTime ?? ev.end.date ?? null,
      all_day: !ev.start.dateTime,
      meeting_type_id: defaultType?.id ?? null,
      busy_level: ev.transparency === 'transparent' ? 'free' : 'busy',
      visibility: ev.visibility === 'private' ? 'private' : 'default',
      status: ev.status === 'cancelled' ? 'cancelled' : 'confirmed',
    }))

  if (rows.length > 0) {
    const { error } = await supabase
      .from('events')
      .upsert(rows, { onConflict: 'google_event_id' })
    if (error) return { error: error.message }
  }

  revalidatePath('/')
  return { success: true, count: rows.length }
}