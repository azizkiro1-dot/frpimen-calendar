import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DateTime } from 'luxon'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CheckSquare, Clock, TrendingUp } from 'lucide-react'

const TZ = 'America/Chicago'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  const now = new Date()
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0)
  const endToday = new Date(now); endToday.setHours(23, 59, 59, 999)
  const in7 = new Date(now); in7.setDate(in7.getDate() + 7)
  const in30 = new Date(now); in30.setDate(in30.getDate() + 30)
  const last30 = new Date(now); last30.setDate(last30.getDate() - 30)

  const { data: todayEvents } = await supabase
    .from('events').select('*, meeting_types(name, color)')
    .eq('owner_id', user.id)
    .gte('starts_at', startToday.toISOString())
    .lte('starts_at', endToday.toISOString())
    .order('starts_at')

  const { data: next7 } = await supabase
    .from('events').select('id')
    .eq('owner_id', user.id)
    .gte('starts_at', now.toISOString())
    .lte('starts_at', in7.toISOString())

  const { data: next30 } = await supabase
    .from('events').select('id, meeting_type_id, meeting_types(name, color)')
    .eq('owner_id', user.id)
    .gte('starts_at', now.toISOString())
    .lte('starts_at', in30.toISOString())

  const { data: past30 } = await supabase
    .from('events').select('id')
    .eq('owner_id', user.id)
    .gte('starts_at', last30.toISOString())
    .lt('starts_at', now.toISOString())

  const { data: openTasks } = await supabase
    .from('tasks').select('id').eq('owner_id', user.id).eq('status', 'open')

  const { data: overdueTasks } = await supabase
    .from('tasks').select('id').eq('owner_id', user.id).eq('status', 'open')
    .lt('due_date', now.toISOString().split('T')[0])

  const typeCounts = new Map<string, { name: string; color: string; count: number }>()
  for (const e of next30 ?? []) {
    const mt: any = e.meeting_types
    if (!mt) continue
    const existing = typeCounts.get(mt.name)
    if (existing) existing.count++
    else typeCounts.set(mt.name, { name: mt.name, color: mt.color ?? '#64748b', count: 1 })
  }
  const topTypes = Array.from(typeCounts.values()).sort((a, b) => b.count - a.count)
  const todayCount = todayEvents?.length ?? 0

  const stats: { label: string; value: number; sub: string; tone: string; icon: any }[] = [
    { label: 'Today', value: todayCount, sub: 'events', tone: '#f59e0b', icon: Calendar },
    { label: 'Next 7 days', value: next7?.length ?? 0, sub: 'upcoming', tone: '#3b82f6', icon: Clock },
    { label: 'Open tasks', value: openTasks?.length ?? 0, sub: `${overdueTasks?.length ?? 0} overdue`, tone: '#10b981', icon: CheckSquare },
    { label: 'Past 30 days', value: past30?.length ?? 0, sub: 'completed', tone: '#ec4899', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar userName={profile?.full_name ?? user.email ?? ''} userEmail={user.email ?? ''} />

      <div className="lg:pl-64 transition-[padding] duration-200">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Hero card */}
          <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-neutral-200/80 shadow-sm bg-white">
            <div className="absolute inset-0 -z-0 opacity-90"
                 style={{ background: 'linear-gradient(120deg, #d1fae5 0%, #fef3c7 35%, #fce7f3 70%, #ddd6fe 100%)' }} />
            <div className="absolute -right-16 -top-12 h-56 w-56 rounded-full opacity-40 -z-0"
                 style={{ background: 'radial-gradient(circle, #34d399, transparent 70%)' }} />
            <div className="relative z-10">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-700 font-semibold">Dashboard</p>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 mt-1 leading-[1.05]">
                {todayCount === 0 ? 'Quiet day ahead' : `You have ${todayCount} ${todayCount === 1 ? 'meeting' : 'meetings'} today`}
              </h1>
              <p className="text-sm sm:text-base text-neutral-700 mt-2">
                {DateTime.now().setZone(TZ).toFormat('cccc, LLLL d')}
              </p>
            </div>
          </div>

          {/* Stat cards — design 6 colorful */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {stats.map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-2xl bg-white border border-neutral-200/80 p-4 sm:p-5 relative overflow-hidden">
                  <div className="absolute right-3 top-3 h-9 w-9 rounded-xl flex items-center justify-center"
                       style={{ background: hexToRgba(s.tone, 0.12), color: s.tone }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium">{s.label}</p>
                  <p className="text-3xl sm:text-4xl font-bold mt-2 text-neutral-900 tabular-nums">{s.value}</p>
                  <p className="text-[11.5px] text-neutral-500 mt-0.5">{s.sub}</p>
                </div>
              )
            })}
          </div>

          {/* Body */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
            <div className="rounded-2xl bg-white border border-neutral-200/80 p-5 sm:p-6">
              <h2 className="font-semibold text-[15px] mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-neutral-500" /> Today's schedule
              </h2>
              {(!todayEvents || todayEvents.length === 0) ? (
                <p className="text-sm text-neutral-500 py-6 text-center">No events today</p>
              ) : (
                <ul className="space-y-2">
                  {todayEvents.map((e: any) => (
                    <li key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: e.meeting_types?.color ?? '#64748b' }} />
                      <span className="font-medium text-sm flex-1 truncate">{e.title}</span>
                      <span className="text-xs text-neutral-500 tabular-nums">
                        {DateTime.fromISO(e.starts_at, { setZone: true }).setZone(TZ).toFormat('h:mm a')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl bg-white border border-neutral-200/80 p-5 sm:p-6">
              <h2 className="font-semibold text-[15px] mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-neutral-500" /> Next 30 days by type
              </h2>
              {topTypes.length === 0 ? (
                <p className="text-sm text-neutral-500 py-6 text-center">No upcoming events</p>
              ) : (
                <ul className="space-y-2">
                  {topTypes.map(t => (
                    <li key={t.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                      <span className="text-sm flex-1">{t.name}</span>
                      <span className="text-sm font-semibold text-neutral-900 tabular-nums">{t.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(n.substring(0, 2), 16)
  const g = parseInt(n.substring(2, 4), 16)
  const b = parseInt(n.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
