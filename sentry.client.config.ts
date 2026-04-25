import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event) {
      // Strip event titles + locations from breadcrumbs to protect confidentiality
      if (event.breadcrumbs) {
        for (const b of event.breadcrumbs) {
          if (b.message && /confidential|priest|confession/i.test(b.message)) return null
          if (b.data) {
            delete b.data.title
            delete b.data.location
            delete b.data.description
          }
        }
      }
      return event
    },
  })
}
