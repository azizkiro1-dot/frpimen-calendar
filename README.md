# Fr. Pimen Calendar

Private calendar + tasks app for Fr. Pimen. Single-user license.

## Stack
- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript
- Supabase (auth + Postgres)
- shadcn/ui + Tailwind CSS 4
- Framer Motion
- FullCalendar 6 + Luxon
- Anthropic Claude (chat)
- Resend (email)
- web-push (notifications)
- Vercel deploy

## Required env vars

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
CRON_SECRET=               # random string for /api/cron/* auth
ALLOWED_EMAILS=            # comma-separated; only these may sign in
VAPID_PUBLIC_KEY=          # web-push (run `npx web-push generate-vapid-keys`)
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=  # same as VAPID_PUBLIC_KEY (client uses it)
VAPID_SUBJECT=mailto:you@example.com
```

## First-run

1. Provision Supabase project, run `supabase-migrations.sql` in SQL editor
2. Run `npx web-push generate-vapid-keys` and add the keys to Vercel env
3. In Supabase Auth settings, enable Google provider, add `https://YOUR_DOMAIN/auth/callback` to allowed redirect URLs
4. In Vercel, set every env var above
5. `git push` — Vercel auto-deploys
6. Sign in once with the priest's Gmail (must match `ALLOWED_EMAILS`)
7. After deploy, run DB cleanup once (browser console on the app):
   ```js
   fetch('/api/admin/dedup-events',{method:'POST'}).then(r=>r.json()).then(console.log)
   ```

## Routes
- `/`           Calendar (month/week/day/agenda)
- `/dashboard`  Stats + today's schedule + types breakdown
- `/tasks`      Card-grid task manager
- `/chat`       Claude assistant (knows your schedule)
- `/sharing`    Grant/revoke calendar access (4 tiers)
- `/rsvp`       Respond to invites where you're an attendee
- `/import`     Calendly CSV import
- `/privacy`    Privacy policy
- `/terms`      Terms of use

## Cron jobs (Vercel)
- `0 12 * * *`  Daily summary email (7am Central)
- `*/5 * * * *` Reminder push notifications (15-min lead time)

Both require header `Authorization: Bearer $CRON_SECRET`.

## Single-tenant lockdown
- `ALLOWED_EMAILS` env var gates `/auth/callback` and `middleware.ts`
- Any non-allowed email is signed out and redirected to `/login?error=not_authorized`

## Local dev

```
npm install
npm run dev          # turbopack, port 3000
```

## Build

```
npm run build
```

## Database hardening
See `supabase-migrations.sql` for indexes + RLS confirmation.

## Support
For issues, check Vercel logs first, then Supabase logs. The app is a single-user deployment; expect low traffic and predictable behavior.
