import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// One-time cleanup: removes duplicate events with same (title, starts_at, ends_at, owner_id)
// keeping the oldest by created_at.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('events')
    .select('id, title, starts_at, ends_at, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const keepers = new Set<string>()
  const dupes: string[] = []
  const seen = new Set<string>()
  for (const r of rows ?? []) {
    const key = `${(r.title ?? '').trim().toLowerCase()}|${r.starts_at}|${r.ends_at}`
    if (seen.has(key)) dupes.push(r.id)
    else { seen.add(key); keepers.add(r.id) }
  }

  if (dupes.length === 0) {
    return NextResponse.json({ removed: 0, total: rows?.length ?? 0, message: 'no duplicates' })
  }

  const { error: delErr } = await supabase.from('events').delete().in('id', dupes).eq('owner_id', user.id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ removed: dupes.length, kept: keepers.size, total: rows?.length ?? 0 })
}
