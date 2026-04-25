import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { BookingLinksPanel } from '@/components/booking-links-panel'

export default async function BookingLinksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: links }, { data: types }] = await Promise.all([
    supabase.from('profiles').select('full_name, default_location').eq('id', user.id).single(),
    supabase.from('booking_links').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('meeting_types').select('id, name, color').eq('owner_id', user.id).order('name'),
  ])

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar userName={profile?.full_name ?? user.email ?? ''} userEmail={user.email ?? ''} />
      <div className="lg:pl-64">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight">Booking links</h1>
          <p className="text-sm text-neutral-600 mt-1.5">Public scheduling pages for parishioners</p>
          <div className="mt-6">
            <BookingLinksPanel
              links={links ?? []}
              meetingTypes={types ?? []}
              defaultLocation={profile?.default_location ?? ''}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
