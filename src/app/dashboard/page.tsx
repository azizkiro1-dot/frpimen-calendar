import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CheckSquare, MessageSquare, Users, LayoutDashboard, LogOut } from 'lucide-react'

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
    .gte('start_time', startToday.toISOString())
    .lte('start_time', endToday.toISOString())
    .order('start_time')

  const { data: next7 } = await supabase
    .from('events').select('id')
    .eq('owner_id', user.id)
    .gte('start_time', now.toISOString())
    .lte('start_time', in7.toISOString())

  const { data: next30 } = await supabase
    .from('events').select('id, meeting_type_id, meeting_types(name, color)')
    .eq('owner_id', user.id)
    .gte('start_time', now.toISOString())
    .lte('start_time', in30.toISOString())

  const { data: past30 } = await supabase
    .from('events').select('id')
    .eq('owner_id', user.id)
    .gte('start_time', last30.toISOString())
    .lt('start_time', now.toISOString())

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
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Fr. Pimen Calendar</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/"><Button variant="ghost" size="sm"><Calendar className="h-4 w-4 mr-2"/>Calendar</Button></Link>
            <Link href="/dashboard"><Button variant="secondary" size="sm"><LayoutDashboard className="h-4 w-4 mr-2"/>Dashboard</Button></Link>
            <Link href="/tasks"><Button variant="ghost" size="sm"><CheckSquare className="h-4 w-4 mr-2"/>Tasks</Button></Link>
            <Link href="/chat"><Button variant="ghost" size="sm"><MessageSquare className="h-4 w-4 mr-2"/>Chat</Button></Link>
            <Link href="/sharing"><Button variant="ghost" size="sm"><Users className="h-4 w-4 mr-2"/>Sharing</Button></Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:inline">{profile?.full_name ?? user.email}</span>
            <form action="/auth/logout" method="post">
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

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
                    <span className="text-slate-500 ml-auto">{new Date(e.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
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
