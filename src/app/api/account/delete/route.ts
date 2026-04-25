import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (body?.confirm !== 'DELETE') {
    return NextResponse.json({ error: 'must confirm with DELETE' }, { status: 400 })
  }

  // Cascade delete user data via service-role
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createServiceClient(url, key)

  // Delete data in app tables first
  await admin.from('chat_messages').delete().eq('owner_id', user.id)
  await admin.from('tasks').delete().eq('owner_id', user.id)
  await admin.from('event_attendees').delete().eq('email', user.email ?? '')
  await admin.from('events').delete().eq('owner_id', user.id)
  await admin.from('meeting_types').delete().eq('owner_id', user.id)
  await admin.from('calendar_shares').delete().eq('owner_id', user.id)
  await admin.from('push_subscriptions').delete().eq('user_id', user.id)
  await admin.from('profiles').delete().eq('id', user.id)
  // Finally delete the auth user
  await admin.auth.admin.deleteUser(user.id)

  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
