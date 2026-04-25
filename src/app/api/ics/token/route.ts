import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const secret = process.env.ICS_FEED_SECRET
  if (!secret) return NextResponse.json({ error: 'feed not configured' }, { status: 500 })

  const sig = crypto.createHmac('sha256', secret).update(user.id).digest('hex')
  const token = Buffer.from(`${user.id}:${sig}`, 'utf8').toString('base64url')

  return NextResponse.json({ token, url: `/api/ics?token=${token}` })
}
