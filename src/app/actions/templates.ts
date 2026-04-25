'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Tpl = {
  name: string
  title: string
  description?: string | null
  location?: string | null
  default_duration_minutes?: number
  meeting_type_id?: string | null
  busy_level?: string
  visibility?: string
  rrule?: string | null
  attendees?: string | null
}

export async function listTemplates() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('event_templates')
    .select('*')
    .eq('owner_id', user.id)
    .order('name')
  return data ?? []
}

export async function createTemplate(t: Tpl) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('event_templates').insert({
    owner_id: user.id,
    name: t.name,
    title: t.title,
    description: t.description ?? null,
    location: t.location ?? null,
    default_duration_minutes: t.default_duration_minutes ?? 60,
    meeting_type_id: t.meeting_type_id ?? null,
    busy_level: t.busy_level ?? 'busy',
    visibility: t.visibility ?? 'default',
    rrule: t.rrule ?? null,
    attendees: t.attendees ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath('/templates')
  return { success: true }
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('event_templates').delete().eq('id', id).eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/templates')
  return { success: true }
}
