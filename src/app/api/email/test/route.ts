import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const hasKey = !!process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

  if (!hasKey) return NextResponse.json({ ok: false, reason: 'RESEND_API_KEY not set in Vercel env' })

  try {
    const { sendEmail } = await import('@/lib/email/send')
    const r = await sendEmail(user.email, 'Test from Fr. Pimen Calendar', `<p>Diagnostic email — sent at ${new Date().toISOString()}</p><p>From: <code>${from}</code></p>`)
    return NextResponse.json({ ok: true, from, to: user.email, result: r })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'send failed' })
  }
}
