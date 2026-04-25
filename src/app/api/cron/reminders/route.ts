import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

// Runs every 5 min via Vercel cron. Sends push for events starting in next 15 min.
export async function GET(req: Request) {
  const reqUrl = new URL(req.url)
  const queryKey = reqUrl.searchParams.get('key')
  const headerKey = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/, '')
  if (queryKey !== process.env.CRON_SECRET && headerKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const sb = createClient(url, serviceKey)

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:contact@example.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )

  const now = new Date()
  const in15 = new Date(now.getTime() + 15 * 60_000)
  const in16 = new Date(now.getTime() + 16 * 60_000)

  // Events starting in 15-16 minutes — single 1-min window per cron tick
  const { data: events } = await sb
    .from('events')
    .select('id, title, owner_id, starts_at, location')
    .gte('starts_at', in15.toISOString())
    .lt('starts_at', in16.toISOString())

  if (!events?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const ev of events) {
    const { data: subs } = await sb.from('push_subscriptions').select('*').eq('user_id', ev.owner_id)
    if (!subs?.length) continue
    const payload = JSON.stringify({
      title: `In 15 min: ${ev.title}`,
      body: ev.location ? `📍 ${ev.location}` : 'Tap to view',
      url: '/',
    })
    for (const s of subs) {
      try {
        await webpush.sendNotification({
          endpoint: s.endpoint,
          keys: { p256dh: s.keys_p256dh, auth: s.keys_auth },
        }, payload)
        sent++
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await sb.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    }
  }

  return NextResponse.json({ sent, eventCount: events.length })
}
