import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CheckSquare, MessageSquare, Users, LayoutDashboard, LogOut } from 'lucide-react'
import { AppHeader } from '@/components/app-header'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  const now = new Date()
  const startToday = new Date(now); startToday.setHours(0,0,0,0)
  const endToday = new Date(now); endToday.setHours(23,59,59,999)
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
    const key = mt.name
    const existing = typeCounts.get(key)
    if (existing) existing.count++
    else typeCounts.set(key, { name: mt.name, color: mt.color ?? '#64748b', count: 1 })
  }
  const topTypes = Array.from(typeCounts.values()).sort((a, b) => b.count - a.count)

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader userName={profile?.full_name ?? user.email ?? ""} userEmail={user.email ?? ""} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-600">Overview of schedule and tasks</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Today</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{todayEvents?.length ?? 0}</p><p className="text-xs text-slate-500">events</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Next 7 days</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{next7?.length ?? 0}</p><p className="text-xs text-slate-500">events</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Open tasks</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{openTasks?.length ?? 0}</p><p className="text-xs text-slate-500">{overdueTasks?.length ?? 0} overdue</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Past 30 days</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{past30?.length ?? 0}</p><p className="text-xs text-slate-500">completed</p></CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Today's schedule</CardTitle></CardHeader>
            <CardContent>
              {(!todayEvents || todayEvents.length === 0) && <p className="text-sm text-slate-500">No events today</p>}
              <ul className="space-y-2">
                {todayEvents?.map((e: any) => (
                  <li key={e.id} className="flex items-center gap-3 text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ background: e.meeting_types?.color ?? '#64748b' }} />
                    <span className="font-medium">{e.title}</span>
                    <span className="text-slate-500 ml-auto">{new Date(e.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Next 30 days by type</CardTitle></CardHeader>
            <CardContent>
              {topTypes.length === 0 && <p className="text-sm text-slate-500">No upcoming events</p>}
              <ul className="space-y-2">
                {topTypes.map(t => (
                  <li key={t.name} className="flex items-center gap-3 text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                    <span>{t.name}</span>
                    <span className="text-slate-500 ml-auto font-medium">{t.count}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
