# Performance + Sentry

## Sentry (auto-active when env vars set)

The integration is wired. To activate, set in Vercel:

```
NEXT_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
SENTRY_DSN=                  # same as NEXT_PUBLIC_SENTRY_DSN
SENTRY_ORG=<your-org-slug>
SENTRY_PROJECT=frpimen-calendar
SENTRY_AUTH_TOKEN=<from sentry.io/settings/account/api/auth-tokens>  # only needed for source maps upload
```

Without these, the app builds + runs normally; Sentry is no-op.

### Privacy
Confidential event titles/locations are scrubbed in `beforeSend`. Replay
masks all text + inputs. Errors capture stack traces, not event content.

## Lighthouse audit (run yourself)

```
npx lighthouse https://frpimen-calendar.vercel.app --view --preset=desktop
npx lighthouse https://frpimen-calendar.vercel.app --view --form-factor=mobile
```

Common targets to keep above 90:
- Performance
- Accessibility
- Best Practices
- SEO

### Already in place
- `optimizePackageImports` for heavy libs (FullCalendar, Lucide, Luxon, Framer)
- Dynamic-imported event editor (cuts initial JS ~40kb)
- `content-visibility: auto` on calendar bodies (skips offscreen render)
- Preact-style minimal DOM in cards
- AVIF/WebP for any images
- No source maps in prod browser
- `prefers-reduced-motion` respected

### If Lighthouse flags
- **LCP > 2.5s**: hero card image too large — already CSS gradients only
- **CLS**: usually fine (no shifting layouts)
- **TBT**: lazy-load FullCalendar plugins as user navigates views (future opt)

Re-run after each ship to catch regressions.
