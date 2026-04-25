# External cron for push reminders (Hobby plan)

Vercel Hobby blocks crons running more than once a day. To get the 15-min push
reminders working, use a free external pinger.

## UptimeRobot setup (free, no card)

1. Sign up at https://uptimerobot.com (free tier: 50 monitors, 5-min checks).
2. Add Monitor → **HTTP(S)** type.
3. URL: `https://frpimen-calendar.vercel.app/api/cron/reminders?key=YOUR_CRON_SECRET`
4. Monitoring Interval: **5 minutes**.
5. Save.

UptimeRobot will GET that URL every 5 min. The endpoint already validates
`Bearer $CRON_SECRET` via the `Authorization` header. Adjust the route to
ALSO accept the secret via `?key=` query param so UptimeRobot (which can't
set custom headers on free tier) can pass it.

## Optional: cron-job.org

Same idea but supports custom headers on free tier — cleaner. Use:
- URL: `https://frpimen-calendar.vercel.app/api/cron/reminders`
- Header: `Authorization: Bearer YOUR_CRON_SECRET`
- Interval: every 5 min.

## When you upgrade to Vercel Pro

Re-add the cron entry to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/daily-summary", "schedule": "0 12 * * *" },
    { "path": "/api/cron/reminders", "schedule": "*/5 * * * *" }
  ]
}
```

Then disable the external pinger to avoid duplicates.
