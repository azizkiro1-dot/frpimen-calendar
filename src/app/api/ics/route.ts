import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ICS feed for subscribing to your calendar from Apple Calendar / Google / Outlook.
// URL format: /api/ics?token=<base64(userId:hmac)>
// Token is generated server-side once per user; the secret is ICS_FEED_SECRET.

function escapeICS(s: string): string {
  return (s ?? '').replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n')
}
function fmt(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace(/Z?$/, 'Z')
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const secret = process.env.ICS_FEED_SECRET
  if (!token || !secret) return NextResponse.json({ error: 'missing token' }, { status: 401 })

  const [userId, sig] = Buffer.from(token, 'base64url').toString('utf8').split(':')
  if (!userId || !sig) return NextResponse.json({ error: 'bad token' }, { status: 401 })

  const expected = crypto.createHmac('sha256', secret).update(userId).digest('hex')
  if (expected !== sig) return NextResponse.json({ error: 'invalid token' }, { status: 401 })

  const sb = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const horizonStart = new Date(); horizonStart.setMonth(horizonStart.getMonth() - 3)
  const horizonEnd = new Date(); horizonEnd.setMonth(horizonEnd.getMonth() + 12)

  const { data: events } = await sb
    .from('events')
    .select('id, title, description, location, starts_at, ends_at, visibility, created_at')
    .eq('owner_id', userId)
    .gte('starts_at', horizonStart.toISOString())
    .lt('starts_at', horizonEnd.toISOString())
    .order('starts_at')

  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Fr Pimen Calendar//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n'
  ics += 'X-WR-CALNAME:Fr. Pimen Calendar\r\n'
  ics += `X-WR-TIMEZONE:America/Chicago\r\n`

  for (const e of events ?? []) {
    const title = e.visibility === 'confidential' ? 'Busy' : (e.title ?? 'Untitled')
    ics += 'BEGIN:VEVENT\r\n'
    ics += `UID:${e.id}@frpimen-calendar\r\n`
    ics += `DTSTAMP:${fmt(new Date(e.created_at).toISOString())}\r\n`
    ics += `DTSTART:${fmt(e.starts_at)}\r\n`
    ics += `DTEND:${fmt(e.ends_at)}\r\n`
    ics += `SUMMARY:${escapeICS(title)}\r\n`
    if (e.location && e.visibility !== 'confidential') ics += `LOCATION:${escapeICS(e.location)}\r\n`
    if (e.description && e.visibility !== 'confidential') ics += `DESCRIPTION:${escapeICS(e.description)}\r\n`
    ics += 'END:VEVENT\r\n'
  }
  ics += 'END:VCALENDAR\r\n'

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
