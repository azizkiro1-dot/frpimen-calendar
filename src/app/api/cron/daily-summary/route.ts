import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { DateTime } from 'luxon'
import { sendEmail } from '@/lib/email/send'

const TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'America/Chicago'

function authOk(req: Request) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  return process.env.CRON_SECRET && auth === expected
}

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runSummary()
}

export async function POST(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runSummary()
}

async function runSummary() {
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = DateTime.now().setZone(TZ)
  const startUtc = now.startOf('day').toUTC().toISO()!
  const endUtc = now.endOf('day').toUTC().toISO()!

  const { data: profiles } = await admin.from('profiles').select('id, email, full_name')
  const sent: string[] = []
  const skipped: string[] = []

  for (const p of profiles ?? []) {
    if (!p.email) { skipped.push(`${p.id}: no email`); continue }

    const { data: events } = await admin
      .from('events')
      .select('title, starts_at, ends_at, location, busy_level')
      .eq('owner_id', p.id)
      .gte('starts_at', startUtc)
      .lte('starts_at', endUtc)
      .order('starts_at', { ascending: true })

    const { data: tasks } = await admin
      .from('tasks')
      .select('title, priority, due_date')
      .eq('owner_id', p.id)
      .eq('status', 'open')
      .lte('due_date', now.toISODate())
      .order('priority', { ascending: false })
      .limit(10)

    const eventsHtml = (events ?? []).length === 0
      ? '<p style="color:#64748b;">No events scheduled.</p>'
      : `<ul style="padding-left:18px;line-height:1.7;">${(events ?? []).map(e => {
          const s = DateTime.fromISO(e.starts_at, { zone: 'utc' }).setZone(TZ)
          const en = DateTime.fromISO(e.ends_at, { zone: 'utc' }).setZone(TZ)
          return `<li><strong>${escapeHtml(e.title)}</strong> — ${s.toFormat('h:mm a')} to ${en.toFormat('h:mm a')}${e.location ? ` <span style="color:#64748b;">(${escapeHtml(e.location)})</span>` : ''}</li>`
        }).join('')}</ul>`

    const tasksHtml = (tasks ?? []).length === 0
      ? '<p style="color:#64748b;">No open tasks due.</p>'
      : `<ul style="padding-left:18px;line-height:1.7;">${(tasks ?? []).map(t =>
          `<li>${escapeHtml(t.title)}${t.due_date ? ` <span style="color:#64748b;">(due ${t.due_date})</span>` : ''} <span style="color:#94a3b8;">— ${t.priority}</span></li>`
        ).join('')}</ul>`

    const greet = p.full_name ? `Good morning, ${escapeHtml(p.full_name)}` : 'Good morning'
    const html = `
<div style="font-family:-apple-system,kMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
  <h2 style="margin:0 0 4px;">${greet}</h2>
  <p style="color:#64748b;margin:0 0 24px;">${now.toFormat('cccc, LLLL d, yyyy')}</p>
  <h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#475569;">Today's schedule</h3>
  ${eventsHtml}
  <h3 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#475569;">Open tasks</h3>
  ${tasksHtml}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
  <p style="font-size:12px;color:#94a3b8;">Fr. Pimen Calendar — daily summary</p>
</div>`

    try {
      await sendEmail(p.email, `Today: ${(events ?? []).length} events, ${(tasks ?? []).length} tasks`, html)
      sent.push(p.email)
    } catch (e: any) {
      skipped.push(`${p.email}: ${e.message}`)
    }
  }

  return NextResponse.json({ sent, skipped, count: sent.length })
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
