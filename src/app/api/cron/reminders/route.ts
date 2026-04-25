import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DateTime } from 'luxon'
import { sendEmail } from '@/lib/email/send'

const TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'America/Chicago'

function authOk(req: Request) {
  const auth = req.headers.get('authorization')
  return process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(req: Request) {
  if (!authOk(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return run()
}

export async function POST(req: Request) {
  if (!authOk(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return run()
}

async function run() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = DateTime.now().toUTC()
  const windowEnd = now.plus({ minutes: 45 })

  const { data: events } = await admin
    .from('events')
    .select('id, title, starts_at, ends_at, location, description, owner_id')
    .gte('starts_at', now.toISO())
    .lte('starts_at', windowEnd.toISO())
    .is('reminded_at', null)

  const sent: string[] = []
  const errors: string[] = []

  for (const e of events ?? []) {
    const { data: owner } = await admin
      .from('profiles').select('email, full_name').eq('id', e.owner_id).single()
    if (!owner?.email) continue

    const startLocal = DateTime.fromISO(e.starts_at, { zone: 'utc' }).setZone(TZ)
    const minsUntil = Math.round(startLocal.diffNow('minutes').minutes)

    const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a;">
  <div style="background:#fef3c7;border-radius:10px;padding:16px;margin-bottom:16px;">
    <p style="margin:0;font-size:13px;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">Starting in ${minsUntil} min</p>
    <h2 style="margin:6px 0 0;">${escapeHtml(e.title)}</h2>
  </div>
  <p style="margin:0 0 6px;"><strong>When:</strong> ${startLocal.toFormat('EEE LLL d, h:mm a')} (${TZ})</p>
  ${e.location ? `<p style="margin:0 0 6px;"><strong>Location:</strong> ${escapeHtml(e.location)}</p>` : ''}
  ${e.description ? `<p style="margin:12px 0 0;color:#334155;">${escapeHtml(e.description).replace(/\n/g, '<br>')}</p>` : ''}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
  <p style="font-size:12px;color:#94a3b8;">Fr. Pimen Calendar — meeting reminder</p>
</div>`

    try {
      await sendEmail(owner.email, `In ${minsUntil} min: ${e.title}`, html)
      await admin.from('events').update({ reminded_at: now.toISO() }).eq('id', e.id)
      sent.push(e.id)
    } catch (err: any) {
      errors.push(`${e.id}: ${err.message}`)
    }
  }

  return NextResponse.json({ sent, errors, checked: events?.length ?? 0 })
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '> '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
