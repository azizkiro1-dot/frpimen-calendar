'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Anthropic from '@anthropic-ai/sdk'
import { DateTime } from 'luxon'

const TZ = 'America/Chicago'

export async function quickAdd(text: string): Promise<{ success?: boolean; error?: string; eventId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  if (!text?.trim()) return { error: 'empty' }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const now = DateTime.now().setZone(TZ)

  const sys = `Parse a calendar event request and return ONLY a JSON object with: title (string), starts_at (ISO 8601 UTC), ends_at (ISO 8601 UTC), location (string or null). Use America/Chicago timezone for interpreting "today", "tomorrow", weekdays, etc. Default duration: 60 minutes if not specified. Today is ${now.toISO()}. Return JSON only, no prose, no markdown.`

  let parsed: any
  try {
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: sys,
      messages: [{ role: 'user', content: text }],
    })
    const block = resp.content[0]
    const raw = block.type === 'text' ? block.text.trim() : ''
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, '')
    parsed = JSON.parse(cleaned)
  } catch (e: any) {
    return { error: 'Could not parse: ' + e.message }
  }

  if (!parsed?.title || !parsed?.starts_at || !parsed?.ends_at) {
    return { error: 'Missing title or time' }
  }

  const { data: typeRow } = await supabase
    .from('meeting_types').select('id').eq('owner_id', user.id).limit(1).single()

  const { data: event, error } = await supabase
    .from('events').insert({
      owner_id: user.id,
      title: parsed.title,
      starts_at: parsed.starts_at,
      ends_at: parsed.ends_at,
      location: parsed.location ?? null,
      all_day: false,
      meeting_type_id: typeRow?.id ?? null,
      busy_level: 'busy',
      visibility: 'default',
    }).select().single()

  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true, eventId: event?.id }
}
