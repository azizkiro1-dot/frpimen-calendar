'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchHit = {
  type: 'event' | 'task'
  id: string
  title: string
  subtitle: string
  href: string
}

export async function searchAll(q: string): Promise<SearchHit[]> {
  if (!q.trim() || q.length < 2) return []
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const term = `%${q.replace(/%/g, '')}%`

  const [events, tasks] = await Promise.all([
    supabase.from('events').select('id, title, starts_at, location').eq('owner_id', user.id).ilike('title', term).order('starts_at', { ascending: false }).limit(20),
    supabase.from('tasks').select('id, title, due_at, status').eq('owner_id', user.id).ilike('title', term).order('due_at', { ascending: false }).limit(20),
  ])

  const hits: SearchHit[] = []
  for (const e of events.data ?? []) {
    const dt = new Date(e.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })
    hits.push({ type: 'event', id: e.id, title: e.title, subtitle: e.location ? `${dt} · ${e.location}` : dt, href: '/' })
  }
  for (const t of tasks.data ?? []) {
    const sub = t.status === 'done' ? 'completed' : (t.due_at ? `due ${new Date(t.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'open')
    hits.push({ type: 'task', id: t.id, title: t.title, subtitle: sub, href: '/tasks' })
  }
  return hits.slice(0, 30)
}
