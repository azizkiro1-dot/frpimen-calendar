import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { BlocksPanel } from '@/components/blocks-panel'

export default async function BlocksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: blocks }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('time_blocks').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar userName={profile?.full_name ?? user.email ?? ''} userEmail={user.email ?? ''} />
      <div className="lg:pl-64">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight">Block off time</h1>
          <p className="text-sm text-neutral-600 mt-1.5">Vacations, days off, daily quiet hours</p>
          <div className="mt-6">
            <BlocksPanel blocks={blocks ?? []} />
          </div>
        </main>
      </div>
    </div>
  )
}
