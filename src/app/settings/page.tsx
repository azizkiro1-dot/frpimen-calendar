import { AppSidebar } from '@/components/app-sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsPanel } from '@/components/settings-panel'

export const metadata = { title: 'Settings · Fr. Pimen Calendar' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar userName={profile?.full_name ?? user.email ?? ''} userEmail={user.email ?? ''} />
      <div className="lg:pl-64">
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-neutral-600 mt-1.5">Manage your account, data, and notifications</p>
          <div className="mt-6">
            <SettingsPanel email={user.email ?? ''} name={profile?.full_name ?? ''} />
          </div>
        </main>
      </div>
    </div>
  )
}
