'use server'

import { DateTime } from 'luxon'

import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export type ConflictEvent = {
  id: string
  title: string
  starts_at: string
  ends_at: string
  busy_level: string
}

export async function checkConflicts(
  startsAt: string,
  endsAt: string,
  excludeId?: string,
): Promise<ConflictEvent[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('events')
    .select('id, title, starts_at, ends_at, busy_level')
    .eq('owner_id', user.id)
    .lt('starts_at', endsAt)
    .gt('ends_at', startsAt)
    .in('busy_level', ['busy', 'out_of_office', 'confidential'])

  if (excludeId) query = query.neq('id', excludeId)

  const { data } = await query
  return (data ?? []) as ConflictEvent[]
}

export async function suggestAlternatives(
  title: string,
  desiredStart: string,
  desiredEnd: string,
  conflicts: ConflictEvent[],
): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const windowStart = new Date(desiredStart)
  const windowEnd = new Date(desiredStart)
  windowEnd.setDate(windowEnd.getDate() + 7)

  const { data: nearby } = await supabase
    .from('events')
    .select('title, starts_at, ends_at, busy_level')
    .eq('owner_id', user.id)
    .gte('starts_at', windowStart.toISOString())
    .lte('starts_at', windowEnd.toISOString())
    .order('starts_at')

  const durationMs = new Date(desiredEnd).getTime() - new Date(desiredStart).getTime()
  const durationMin = Math.round(durationMs / 60000)

  const desiredDt = DateTime.fromISO(desiredStart, { zone: 'utc' }).setZone('America/Chicago')
  const desiredReadable = desiredDt.toFormat('EEE LLL d, h:mm a')
  const todayLocal = DateTime.now().setZone('America/Chicago').toFormat('EEE LLL d, yyyy h:mm a')

  const busyList = (nearby ?? [])
    .map(e => {
      const s = DateTime.fromISO(e.starts_at, { zone: 'utc' }).setZone('America/Chicago')
      const en = DateTime.fromISO(e.ends_at, { zone: 'utc' }).setZone('America/Chicago')
      return `- ${s.toFormat('EEE LLL d h:mm a')} to ${en.toFormat('h:mm a')}: ${e.title} [${e.busy_level}]`
    })
    .join('\n') || '(no other events)'

  const conflictList = conflicts
    .map(c => {
      const s = DateTime.fromISO(c.starts_at, { zone: 'utc' }).setZone('America/Chicago')
      const en = DateTime.fromISO(c.ends_at, { zone: 'utc' }).setZone('America/Chicago')
      return `- "${c.title}" ${s.toFormat('EEE LLL d h:mm a')} to ${en.toFormat('h:mm a')}`
    })
    .join('\n')

  const prompt = `You are Fr. Pimen's smart scheduler. Propose 3 alternative start times for this meeting.

Meeting: "${title}" (${durationMin} min)
Desired: ${desiredReadable}
Current time: ${todayLocal}

Cannot use (overlaps with):
${conflictList}

Other events (next 7 days):
${busyList}

Strict rules:
1. ALL times must be in America/Chicago (Central) timezone
2. Only propose times between 9:00 AM and 7:00 PM Monday-Friday, or 10:00 AM - 5:00 PM Saturday (skip Sundays unless urgent)
3. Times MUST be in the future (after current time)
4. Leave 15 min buffer before and after other events
5. Round to quarter hour (00, 15, 30, 45)
6. Prefer: same day first, then within 3 days, then next week
7. Space the 3 options apart (don't all on same day)

Return ONLY a JSON array of 3 ISO-8601 start times with -05:00 or -06:00 offset, nothing else.
Example format: ["2026-04-24T14:00:00-05:00","2026-04-25T10:30:00-05:00","2026-04-28T15:15:00-05:00"]`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content
      .map(b => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    const arr = JSON.parse(match[0])
    return Array.isArray(arr) ? arr.slice(0, 3) : []
  } catch (e) {
    console.error('suggestAlternatives error:', e)
    return []
  }
}
