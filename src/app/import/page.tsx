import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, CheckSquare, MessageSquare, Users, LayoutDashboard, Upload, LogOut } from 'lucide-react'
import { ImportForm } from '@/components/import-form'

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

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
            <Link href="/dashboard"><Button variant="ghost" size="sm"><LayoutDashboard className="h-4 w-4 mr-2"/>Dashboard</Button></Link>
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
  )
}
