import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { TemplatesPanel } from '@/components/templates-panel'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: profile }, { data: templates }, { data: types }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('event_templates').select('*').eq('owner_id', user.id).order('name'),
    supabase.from('meeting_types').select('id, name, color').eq('owner_id', user.id).order('name'),
  ])

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar userName={profile?.full_name ?? user.email ?? ''} userEmail={user.email ?? ''} />
      <div className="lg:pl-64">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-neutral-600 mt-1.5">Save reusable event configurations</p>
          <div className="mt-6">
            <TemplatesPanel templates={templates ?? []} meetingTypes={types ?? []} />
          </div>
        </main>
      </div>
    </div>
  )
}
