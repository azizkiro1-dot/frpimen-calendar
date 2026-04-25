import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, LogOut, CheckSquare, MessageSquare, LayoutDashboard, Users } from 'lucide-react'
import { SharingManager } from '@/components/sharing-manager'
import { AppSidebar } from '@/components/app-sidebar'

export default async function SharingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const { data: shares } = await supabase
    .from('calendar_shares')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar userName={profile?.full_name ?? user.email ?? ""} userEmail={user.email ?? ""} />

      <div className="lg:pl-64 transition-[padding] duration-200">
      <main className="max-w-4xl mx-auto px-4 py-6">
        <SharingManager shares={shares ?? []} />
      </main>
      </div>
    </div>
  )
}