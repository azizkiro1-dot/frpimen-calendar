import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC = ['/login', '/auth/callback', '/auth/logout', '/privacy', '/terms', '/api/cron', '/book', '/api/ics']

function isPublic(pathname: string): boolean {
  return PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip static assets + image opt
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/admin') ||
    pathname.includes('.')
  ) return NextResponse.next()

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isPublic(pathname)) return res

  if (!user) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Belt-and-suspenders single-tenant lock
  const allowed = (process.env.ALLOWED_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const email = user.email?.toLowerCase()
  if (allowed.length > 0 && email && !allowed.includes(email)) {
    await supabase.auth.signOut()
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'not_authorized')
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
