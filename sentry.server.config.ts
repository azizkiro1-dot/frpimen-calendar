import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Server-side: scrub any event title/location from error context
      if (event.contexts?.event_data) {
        delete (event.contexts.event_data as any).title
        delete (event.contexts.event_data as any).location
      }
      return event
    },
  })
}
