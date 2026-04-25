import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar, LogOut, CheckSquare, MessageSquare, LayoutDashboard, Users } from 'lucide-react'
import Link from 'next/link'
import { CalendarPage } from '@/components/calendar-page'
import { SyncButton } from '@/components/sync-button'
import type { CalendarEvent } from '@/components/calendar-view'
import { AppHeader } from '@/components/app-header'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResp, eventsResp, typesResp] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('events').select('*, meeting_types(id, name, color)').order('starts_at'),
    supabase.from('meeting_types').select('*').eq('owner_id', user.id).order('name'),
  ])

  const profile = profileResp.data
  const rawEvents = eventsResp.data ?? []
  const meetingTypes = typesResp.data ?? []

  const calendarEvents: CalendarEvent[] = rawEvents.map((e: any) => ({
    id: e.id,
    title: e.visibility === 'confidential' && e.owner_id !== user.id ? 'Busy' : e.title,
    start: ensureUtc(e.starts_at),
    end: ensureUtc(e.ends_at),
    allDay: e.all_day,
    ...(e.rrule ? { rrule: { freq: parseFreq(e.rrule), dtstart: ensureUtc(e.starts_at), ...parseRruleOptions(e.rrule) }, duration: msDiff(e.starts_at, e.ends_at) } : {}),
    backgroundColor: e.meeting_types?.color ?? '#3b82f6',
    borderColor: e.meeting_types?.color ?? '#3b82f6',
    extendedProps: {
      busy_level: e.busy_level,
      visibility: e.visibility,
      meeting_type: e.meeting_types?.name,
      location: e.location,
      description: e.description,
    },
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader userName={profile?.full_name ?? user.email ?? ""} userEmail={user.email ?? ""} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <div className="rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 35%, #fef9c3 70%, #fce7f3 100%)' }}>
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-700 mb-1.5 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Chicago' })}</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' })}</h2>
            <p className="text-sm text-slate-700 mt-1">Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Father'}</p>
          </div>
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #fbbf24, transparent 70%)' }} />
          <div className="absolute -right-8 -bottom-12 h-40 w-40 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)' }} />
        </div>
        <CalendarPage
          events={calendarEvents}
          rawEvents={rawEvents}
          meetingTypes={meetingTypes}
        />
      </main>
    </div>
  )
}

function parseFreq(rrule: string): string {
  const m = rrule.toUpperCase().match(/FREQ=(\w+)/)
  return m ? m[1].toLowerCase() : 'weekly'
}

function parseRruleOptions(rrule: string): any {
  const opts: any = {}
  const upper = rrule.toUpperCase()
  const interval = upper.match(/INTERVAL=(\d+)/)
  if (interval) opts.interval = parseInt(interval[1])
  const byday = upper.match(/BYDAY=([A-Z0-9,]+)/)
  if (byday) opts.byweekday = byday[1].split(',').map(parseWeekday).filter(Boolean)
  const bymonthday = upper.match(/BYMONTHDAY=(\d+)/)
  if (bymonthday) opts.bymonthday = [parseInt(bymonthday[1])]
  return opts
}

function parseWeekday(s: string): string | null {
  const m = s.match(/^(-?\d+)?([A-Z]{2})$/)
  if (!m) return null
  return m[2].toLowerCase()
}

function msDiff(a: string, b: string): { milliseconds: number } {
  return { milliseconds: new Date(ensureUtc(b)).getTime() - new Date(ensureUtc(a)).getTime() }
}

function ensureUtc(s: string | null | undefined): string {
  if (!s) return s as any
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(s)) return s
  return s + 'Z'
}
