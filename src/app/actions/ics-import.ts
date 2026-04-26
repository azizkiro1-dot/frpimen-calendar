'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DateTime } from 'luxon'

const TZ = 'America/Chicago'

// Minimal ICS parser — handles VEVENT blocks
function parseICS(text: string): Array<{ uid: string; title: string; starts_at: string; ends_at: string; location?: string; description?: string }> {
  const events: any[] = []
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let cur: any = null
  for (const raw of lines) {
    const line = raw.trim()
    if (line === 'BEGIN:VEVENT') cur = {}
    else if (line === 'END:VEVENT' && cur) {
      if (cur.uid && cur.starts_at && cur.ends_at && cur.title) events.push(cur)
      cur = null
    }
    else if (cur) {
      const idx = line.indexOf(':')
      if (idx < 0) continue
      const key = line.substring(0, idx).split(';')[0].toUpperCase()
      const val = line.substring(idx + 1)
      if (key === 'UID') cur.uid = val
      else if (key === 'SUMMARY') cur.title = val.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/gi, '\n')
      else if (key === 'LOCATION') cur.location = val
      else if (key === 'DESCRIPTION') cur.description = val.replace(/\\n/gi, '\n')
      else if (key === 'DTSTART') cur.starts_at = parseICSDate(val)
      else if (key === 'DTEND')   cur.ends_at = parseICSDate(val)
    }
  }
  return events
}

function parseICSDate(s: string): string {
  // Handles 20260426T130000Z, 20260426T130000, 20260426
  if (/^\d{8}T\d{6}Z$/.test(s)) {
    const dt = DateTime.fromFormat(s, "yyyyLLdd'T'HHmmss'Z'", { zone: 'utc' })
    return dt.toUTC().toISO()!
  }
  if (/^\d{8}T\d{6}$/.test(s)) {
    return DateTime.fromFormat(s, "yyyyLLdd'T'HHmmss", { zone: TZ }).toUTC().toISO()!
  }
  if (/^\d{8}$/.test(s)) {
    return DateTime.fromFormat(s, "yyyyLLdd", { zone: TZ }).toUTC().toISO()!
  }
  return s
}

export async function importIcs(text: string): Promise<{ imported: number; skipped: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { imported: 0, skipped: 0, error: 'unauthorized' }

  const events = parseICS(text)
  if (!events.length) return { imported: 0, skipped: 0, error: 'No VEVENT blocks found' }

  let imported = 0, skipped = 0
  for (const ev of events) {
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('owner_id', user.id)
      .ilike('title', ev.title)
      .eq('starts_at', ev.starts_at)
      .limit(1)
    if (existing && existing.length) { skipped++; continue }

    const { error } = await supabase.from('events').insert({
      owner_id: user.id,
      title: ev.title,
      starts_at: ev.starts_at,
      ends_at: ev.ends_at,
      location: ev.location ?? null,
      description: ev.description ?? null,
      all_day: false,
      busy_level: 'busy',
      visibility: 'default',
    })
    if (!error) imported++
    else skipped++
  }
  revalidatePath('/')
  return { imported, skipped }
}
