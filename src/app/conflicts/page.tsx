import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { runConflictReport } from '@/app/actions/conflict-report'
import { ConflictsView } from '@/components/conflicts-view'

export default async function ConflictsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const sp = await searchParams
  const days = parseInt(sp.days ?? '30')
  const report = await runConflictReport(days)
  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar userName={profile?.full_name ?? user.email ?? ''} userEmail={user.email ?? ''} />
      <div className="lg:pl-64">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight">Conflicts</h1>
          <p className="text-sm text-neutral-600 mt-1.5">Overlapping events in your schedule</p>
          <div className="mt-6">
            <ConflictsView report={report} days={days} />
          </div>
        </main>
      </div>
    </div>
  )
}
