import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_TYPES = [
  { name: 'Mass',          color: '#a855f7', category: 'liturgy',  default_duration_minutes: 60 },
  { name: 'Confession',    color: '#6366f1', category: 'sacrament', default_duration_minutes: 30 },
  { name: 'Baptism',       color: '#06b6d4', category: 'sacrament', default_duration_minutes: 60 },
  { name: 'Wedding',       color: '#ec4899', category: 'sacrament', default_duration_minutes: 90 },
  { name: 'Funeral',       color: '#737373', category: 'sacrament', default_duration_minutes: 90 },
  { name: 'Counseling',    color: '#10b981', category: 'pastoral', default_duration_minutes: 60 },
  { name: 'Hospital visit',color: '#f97316', category: 'pastoral', default_duration_minutes: 45 },
  { name: 'Meeting',       color: '#3b82f6', category: 'admin',    default_duration_minutes: 30 },
  { name: 'Personal',      color: '#fbbf24', category: 'personal', default_duration_minutes: 60 },
]

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('meeting_types').select('id').eq('owner_id', user.id).limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ skipped: true, message: 'meeting types already exist' })
  }

  const rows = DEFAULT_TYPES.map(t => ({ ...t, owner_id: user.id }))
  const { error } = await supabase.from('meeting_types').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ inserted: rows.length })
}
