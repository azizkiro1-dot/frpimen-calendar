import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, CheckSquare, MessageSquare, Users, LayoutDashboard, Upload, LogOut } from 'lucide-react'
import { ImportForm } from '@/components/import-form'
import { AppSidebar } from '@/components/app-sidebar'

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar userName={profile?.full_name ?? user.email ?? ""} userEmail={user.email ?? ""} />
      <div className="lg:pl-64 transition-[padding] duration-200">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-semibold">Import from Calendly</h1>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          Export your Calendly bookings as CSV, then upload here. Duplicates are skipped.
        </p>
        <ol className="text-sm text-slate-600 list-decimal pl-5 mb-6 space-y-1">
          <li>Log in to Calendly → Scheduled Events</li>
          <li>Click "Export" → CSV</li>
          <li>Upload the file below</li>
        </ol>
        <ImportForm />
      </main>
      </div>
    </div>
  )
}
