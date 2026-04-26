# Email setup (Resend) — required for invites + booking confirmations

By default Resend's sandbox only sends emails to YOUR registered Resend account email.
To send invites and booking confirmations to other people, you must verify a domain.

## Quick option: use Resend's free tier with custom domain

1. Sign up at https://resend.com (free: 3000 emails/month, 100/day).
2. **Domains → Add Domain** → enter a domain you own (e.g. `stmarkprosper.org`).
3. Resend shows DNS records (SPF, DKIM, DMARC). Add them at your DNS provider.
4. Wait 10-15 min, click Verify in Resend.
5. In Vercel env vars set:
   ```
   RESEND_API_KEY=re_xxx
   RESEND_FROM="St. Mark Calendar <calendar@stmarkprosper.org>"
   ```
6. Redeploy.

## Without a domain (testing only)

Without verified domain, **only the email registered to your Resend account** receives test sends.
Any email to other addresses is silently dropped.

## Reply-To behavior

The app automatically sets `Reply-To` to the priest's Gmail. So when an attendee
hits "Reply" on an invite, the email goes to the priest directly.

## Diagnostic

Visit `/api/email/test` while logged in to send a test email to yourself.
Returns `{ ok: true }` if Resend accepted the request, or `{ error: ... }` with the reason.

If you get `{ ok: true }` but never receive the email:
- Check spam folder
- Check Resend dashboard → Logs (shows delivered, bounced, blocked)
- The recipient address is not your verified Resend account email → must verify domain
