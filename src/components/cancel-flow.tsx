'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Check } from 'lucide-react'
import { DateTime } from 'luxon'
import { cancelAttendee } from '@/app/actions/cancel'

const TZ = 'America/Chicago'

export function CancelFlow({ attendeeId, sig, attendeeName, event }: any) {
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dt = DateTime.fromISO(event.starts_at, { zone: 'utc' }).setZone(TZ)
  const cancel = async () => {
    setBusy(true); setError('')
    const r = await cancelAttendee(attendeeId, sig)
    if ((r as any)?.error) setError((r as any).error)
    else setDone(true)
    setBusy(false)
  }

  if (done) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
        <Check className="h-6 w-6 text-emerald-600" />
      </div>
      <h1 className="text-xl font-bold">Cancelled</h1>
      <p className="text-sm text-neutral-600 mt-2">The booking has been removed.</p>
    </motion.div>
  )

  return (
    <div>
      <Calendar className="h-7 w-7 text-neutral-700 mb-3" />
      <h1 className="text-xl font-bold">Cancel this booking?</h1>
      <p className="text-sm text-neutral-600 mt-2">{event.title}</p>
      <p className="text-sm text-neutral-700 mt-1">{dt.toFormat('cccc, LLLL d')} at {dt.toFormat('h:mm a')}</p>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button onClick={cancel} disabled={busy}
              className="mt-5 w-full h-11 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50">
        {busy ? 'Cancelling…' : 'Confirm cancel'}
      </button>
    </div>
  )
}
