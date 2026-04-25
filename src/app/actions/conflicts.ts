'use server'

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

  const prompt = `You are a scheduling assistant. Propose 3 alternative time slots for "${title}" (${durationMin} min).

Desired time: ${desiredStart} to ${desiredEnd}
Conflicts: ${conflicts.map(c => `${c.title} (${c.starts_at} - ${c.ends_at})`).join('; ')}

Busy schedule in next 7 days:
${(nearby ?? []).map(e => `- ${e.title}: ${e.starts_at} to ${e.ends_at} [${e.busy_level}]`).join('\n') || '(mostly free)'}

Rules:
- Stay within 9am-8pm Central Time
- Avoid overlaps
- Prefer same day or next day
- Return ONLY a JSON array of 3 ISO start times, e.g. ["2026-04-24T10:00:00-05:00", ...]
- No prose, no markdown, just the JSON array.`

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
