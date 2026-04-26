import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options?: { replyTo?: string; from?: string }
) {
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY missing, skipping email to', to)
    return { skipped: true, reason: 'no_api_key' }
  }
  const from = options?.from ?? FROM
  const replyTo = options?.replyTo
  try {
    const r = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo,
    } as any)
    if ((r as any).error) {
      console.error('Resend error:', (r as any).error)
      return { skipped: false, error: (r as any).error?.message }
    }
    return r
  } catch (e: any) {
    console.error('sendEmail threw:', e?.message)
    return { skipped: false, error: e?.message }
  }
}
