'use server'

import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { DateTime } from 'luxon'

const TZ = 'America/Chicago'

export type ConflictReport = {
  conflicts: Array<{
    a: { id: string; title: string; starts_at: string; ends_at: string }
    b: { id: string; title: string; starts_at: string; ends_at: string }
  }>
  suggestion?: string
}

export async function runConflictReport(rangeDays: number = 30): Promise<ConflictReport> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { conflicts: [] }

  const now = DateTime.now().setZone(TZ)
  const end = now.plus({ days: rangeDays })

  const { data: events } = await supabase
    .from('events')
    .select('id, title, starts_at, ends_at, busy_level')
    .eq('owner_id', user.id)
    .gte('starts_at', now.toUTC().toISO()!)
    .lte('starts_at', end.toUTC().toISO()!)
    .neq('busy_level', 'free')
    .order('starts_at')

  const conflicts: ConflictReport['conflicts'] = []
  const list = events ?? []
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j]
      const aS = new Date(a.starts_at).getTime()
      const aE = new Date(a.ends_at).getTime()
      const bS = new Date(b.starts_at).getTime()
      const bE = new Date(b.ends_at).getTime()
      if (aS < bE && bS < aE) conflicts.push({ a, b })
    }
  }

  let suggestion: string | undefined
  if (conflicts.length > 0 && process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
      const summary = conflicts.slice(0, 10).map(c =>
        `• ${c.a.title} (${DateTime.fromISO(c.a.starts_at, { zone: 'utc' }).setZone(TZ).toFormat('LLL d h:mm a')}) overlaps ${c.b.title} (${DateTime.fromISO(c.b.starts_at, { zone: 'utc' }).setZone(TZ).toFormat('LLL d h:mm a')})`
      ).join('\n')
      const r = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 280,
        messages: [{ role: 'user', content: `These calendar events conflict. Suggest a brief plan (1-2 sentences) for how to resolve them. Don't list specific times.\n\n${summary}` }],
      })
      suggestion = (r.content[0] as any).text?.trim()
    } catch {}
  }

  return { conflicts, suggestion }
}
