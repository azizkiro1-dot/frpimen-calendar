import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DateTime } from 'luxon'
import { AppSidebar } from '@/components/app-sidebar'
import { RsvpList } from '@/components/rsvp-list'

const TZ = 'America/Chicago'

export default async function RsvpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  // Find events where this user is an attendee
  const { data: invites } = await supabase
    .from('event_attendees')
    .select(`
      id, rsvp_status, responded_at,
      events!inner(id, title, description, location, starts_at, ends_at, owner_id, profiles:owner_id(full_name))
    `)
    .eq('email', user.email)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar userName={profile?.full_name ?? user.email ?? ''} userEmail={user.email ?? ''} />
      <div className="lg:pl-64 transition-[padding] duration-200">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your invites</h1>
          <p className="text-sm text-neutral-600 mt-1">Events where you've been invited</p>
          <div className="mt-5">
            <RsvpList invites={(invites ?? []) as any} />
          </div>
        </main>
      </div>
    </div>
  )
}
