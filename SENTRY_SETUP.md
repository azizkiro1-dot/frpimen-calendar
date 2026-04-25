# Sentry error tracking (optional, ~5 min)

Skipped from auto-install because it needs a DSN you create.

## Setup

1. Create free account at https://sentry.io (free tier: 5k errors/month).
2. Create new project → pick **Next.js**.
3. Copy DSN from project settings.

4. Install + auto-config:
   ```
   npx @sentry/wizard@latest -i nextjs
   ```
   Wizard creates `sentry.client.config.ts`, `sentry.server.config.ts`, and adds the DSN to `.env.sentry-build-plugin`.

5. Add Sentry env vars to Vercel:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   SENTRY_AUTH_TOKEN=...
   SENTRY_ORG=...
   SENTRY_PROJECT=frpimen-calendar
   ```

6. Push and redeploy. Errors auto-capture.

## What gets captured
- Server action errors
- React render errors (caught by error boundaries — already in place)
- API route exceptions
- Performance traces (sample rate 10% default)

## What to NOT capture
The Sentry default config sends some user PII. Edit `sentry.client.config.ts`:

```ts
beforeSend(event) {
  // Redact event titles/locations from breadcrumbs
  if (event.breadcrumbs) {
    for (const b of event.breadcrumbs) {
      if (b.message?.includes('confidential')) return null
    }
  }
  return event
}
```

Privacy: confidential events should never appear in Sentry traces.
