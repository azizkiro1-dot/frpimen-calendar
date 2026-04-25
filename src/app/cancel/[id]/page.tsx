import { createClient as createServiceClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { CancelFlow } from '@/components/cancel-flow'

export const dynamic = 'force-dynamic'

export default async function CancelPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ sig?: string }> }) {
  const { id } = await params
  const { sig } = await searchParams
  const secret = process.env.CANCEL_SECRET ?? process.env.CRON_SECRET ?? 'fallback-rotate'

  const sb = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: attendee } = await sb
    .from('event_attendees')
    .select('id, event_id, email, name, canceled_at')
    .eq('id', id)
    .single()

  if (!attendee) return <Layout><h1 className="text-xl font-bold">Not found</h1><p className="text-sm text-neutral-600 mt-2">This cancellation link is invalid.</p></Layout>

  const expected = crypto.createHmac('sha256', secret).update(`${attendee.id}:${attendee.event_id}`).digest('hex').slice(0, 32)
  if (sig !== expected) return <Layout><h1 className="text-xl font-bold">Invalid link</h1><p className="text-sm text-neutral-600 mt-2">This cancellation link is not valid.</p></Layout>

  if (attendee.canceled_at) return <Layout><h1 className="text-xl font-bold">Already cancelled</h1><p className="text-sm text-neutral-600 mt-2">This booking was already cancelled.</p></Layout>

  const { data: event } = await sb.from('events').select('id, title, starts_at, ends_at, location').eq('id', attendee.event_id).single()

  return (
    <Layout>
      <CancelFlow attendeeId={attendee.id} sig={sig!} attendeeName={attendee.name ?? ''} event={event!} />
    </Layout>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-neutral-200 p-8">{children}</div>
    </div>
  )
}
