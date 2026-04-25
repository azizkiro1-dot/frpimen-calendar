import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY missing, skipping email to', to)
    return { skipped: true }
  }
  return resend.emails.send({ from: FROM, to, subject, html })
}
