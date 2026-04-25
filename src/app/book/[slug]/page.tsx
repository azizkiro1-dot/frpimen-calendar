import { createClient as createServiceClient } from '@supabase/supabase-js'
import { BookingFlow } from '@/components/booking-flow'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const sb = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: link, error } = await sb
    .from('booking_links')
    .select('*, meeting_types(name, color)')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (error || !link) {
    console.log(`[/book/${slug}] not found`, error?.message)
    notFound()
  }

  // Fetch priest name separately
  const { data: profile } = await sb
    .from('profiles').select('full_name').eq('id', link.owner_id).single()
  const ownerName = profile?.full_name ?? 'Fr. Pimen'

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden grid md:grid-cols-[280px_1fr]">
        <div className="bg-neutral-50/80 border-b md:border-b-0 md:border-r border-neutral-200 p-6 sm:p-7">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center mb-3 shadow-sm">
            <span className="text-white font-bold">{ownerName[0] ?? 'P'}</span>
          </div>
          <p className="text-[12px] uppercase tracking-wide text-neutral-500 font-semibold">{ownerName}</p>
          <h1 className="text-xl font-bold mt-1 leading-tight tracking-tight">{link.name}</h1>
          <div className="mt-4 space-y-2 text-[13px] text-neutral-600">
            <p>⏱ {link.duration_minutes} min</p>
            {link.location && <p>📍 {link.location}</p>}
            {link.meeting_types?.name && (
              <p className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: link.meeting_types.color }} />
                {link.meeting_types.name}
              </p>
            )}
          </div>
          {link.description && (
            <p className="text-[13px] text-neutral-600 mt-4 leading-relaxed whitespace-pre-line">{link.description}</p>
          )}
        </div>
        <BookingFlow slug={slug} duration={link.duration_minutes} availabilityDays={link.availability_days ?? [1,2,3,4,5,6,7]} />
      </div>
    </div>
  )
}
