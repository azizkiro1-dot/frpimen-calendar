import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message ?? 'session_failed')}`)
  }

  // Check allowed emails
  const allowed = (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  const userEmail = data.session.user.email?.toLowerCase()
  if (allowed.length > 0 && userEmail && !allowed.includes(userEmail)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=not_authorized`)
  }

  // Save Google tokens for Calendar API access
  const providerToken = data.session.provider_token
  const providerRefreshToken = data.session.provider_refresh_token

  if (providerRefreshToken) {
    await supabase
      .from('profiles')
      .update({
        google_access_token: providerToken,
        google_refresh_token: providerRefreshToken,
        google_token_expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
      })
      .eq('id', data.session.user.id)
  }

  return NextResponse.redirect(`${origin}${next}`)
}