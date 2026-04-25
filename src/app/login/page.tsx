'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Calendar, AlertCircle } from 'lucide-react'

function LoginInner() {
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const errCode = params.get('error')

  const errMessage =
    errCode === 'not_authorized' ? 'Only the assigned user can sign in.' :
    errCode === 'missing_code'    ? 'Sign-in did not complete. Try again.' :
    errCode ? decodeURIComponent(errCode) : null

  const signIn = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) { console.error(error); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-neutral-50">
      <div className="absolute inset-0 -z-0"
           style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 30%, #ddd6fe 60%, #d1fae5 100%)' }} />
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-50 -z-0"
           style={{ background: 'radial-gradient(circle, #fbbf24, transparent 70%)' }} />
      <div className="absolute -left-12 -bottom-16 h-56 w-56 rounded-full opacity-40 -z-0"
           style={{ background: 'radial-gradient(circle, #f472b6, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-white/60 p-7 sm:p-8"
      >
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center shadow-md">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold mt-4 tracking-tight">Fr. Pimen Calendar</h1>
          <p className="text-sm text-neutral-600 mt-1.5">Sign in with your Google account</p>
        </div>

        {errMessage && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2 text-[13px] text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{errMessage}</p>
          </div>
        )}

        <button
          onClick={signIn}
          disabled={loading}
          className="mt-6 w-full h-11 rounded-xl bg-neutral-900 text-white font-medium flex items-center justify-center gap-2.5 hover:bg-neutral-800 transition disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p className="text-[11.5px] text-neutral-500 mt-4 text-center">
          Private app · single-user license
        </p>
        <div className="text-[11.5px] text-neutral-500 mt-3 text-center space-x-3">
          <Link href="/privacy" className="hover:text-neutral-900">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-neutral-900">Terms</Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
