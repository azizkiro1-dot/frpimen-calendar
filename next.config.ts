import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react', 'luxon',
      '@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid',
      '@fullcalendar/interaction', '@fullcalendar/list', '@fullcalendar/rrule',
      '@fullcalendar/luxon3',
      'framer-motion',
    ],
  },
  // Aggressive image opt
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Keep client bundles lean
  productionBrowserSourceMaps: false,
}

const sentryOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Skip Sentry build steps if no auth token (devs without Sentry)
  disableLogger: true,
  hideSourceMaps: true,
  widenClientFileUpload: true,
}

const exportConfig = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig

export default exportConfig
