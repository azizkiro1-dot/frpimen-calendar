import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function sendEmail(to: string, subject: string, html: string) {
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY missing, skipping email to', to)
    return { skipped: true }
  }
  return resend.emails.send({ from: FROM, to, subject, html })
}
