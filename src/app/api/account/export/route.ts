import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const [profile, events, tasks, shares, types, chat, attendees] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('events').select('*').eq('owner_id', user.id),
    supabase.from('tasks').select('*').eq('owner_id', user.id),
    supabase.from('calendar_shares').select('*').eq('owner_id', user.id),
    supabase.from('meeting_types').select('*').eq('owner_id', user.id),
    supabase.from('chat_messages').select('*').eq('owner_id', user.id),
    supabase.from('event_attendees').select('*'),
  ])

  const dump = {
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile: profile.data,
    events: events.data ?? [],
    tasks: tasks.data ?? [],
    shares: shares.data ?? [],
    meetingTypes: types.data ?? [],
    chatMessages: chat.data ?? [],
    eventAttendees: (attendees.data ?? []).filter((a: any) => events.data?.some((e: any) => e.id === a.event_id)),
  }

  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="frpimen-calendar-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
