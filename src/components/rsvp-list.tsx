'use client'

import { useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DateTime } from 'luxon'
import { Check, X, HelpCircle, Calendar, MapPin } from 'lucide-react'
import { setRsvp } from '@/app/actions/rsvp'

const TZ = 'America/Chicago'

type Invite = {
  id: string
  rsvp_status: string
  responded_at: string | null
  events: {
    id: string
    title: string
    description: string | null
    location: string | null
    starts_at: string
    ends_at: string
    owner_id: string
    profiles: { full_name: string | null } | null
  }
}

export function RsvpList({ invites }: { invites: Invite[] }) {
  const [pending, startTransition] = useTransition()
  const respond = (eventId: string, status: 'accepted' | 'declined' | 'tentative') => {
    startTransition(() => { setRsvp(eventId, status) })
  }

  if (!invites.length) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <Calendar className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
        <p className="text-sm text-neutral-600">No invites yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {invites.map((inv, i) => {
          const ev = inv.events
          const s = DateTime.fromISO(ev.starts_at, { setZone: true }).setZone(TZ)
          const e = DateTime.fromISO(ev.ends_at, { setZone: true }).setZone(TZ)
          const sameDay = s.hasSame(e, 'day')
          const status = inv.rsvp_status
          return (
            <motion.div
              key={inv.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl flex flex-col items-center justify-center shrink-0 bg-gradient-to-br from-amber-100 to-pink-100 border border-amber-200">
                  <span className="text-[10px] uppercase tracking-wide text-amber-900 font-semibold">{s.toFormat('LLL')}</span>
                  <span className="text-lg font-bold leading-none text-neutral-900 tabular-nums">{s.toFormat('d')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 text-[15px] truncate">{ev.title}</h3>
                  <p className="text-[12.5px] text-neutral-500 mt-0.5">
                    {sameDay
                      ? `${s.toFormat('EEE LLL d')} · ${s.toFormat('h:mm a')} – ${e.toFormat('h:mm a')}`
                      : `${s.toFormat('EEE LLL d, h:mm a')} – ${e.toFormat('EEE LLL d, h:mm a')}`}
                  </p>
                  {ev.location && (
                    <p className="text-[12.5px] text-neutral-500 mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" /> {ev.location}
                    </p>
                  )}
                  {ev.profiles?.full_name && (
                    <p className="text-[11.5px] text-neutral-400 mt-1">From {ev.profiles.full_name}</p>
                  )}
                </div>
                <StatusPill status={status} />
              </div>

              <div className="mt-3.5 flex items-center gap-2 flex-wrap">
                <RsvpButton
                  active={status === 'accepted'} disabled={pending}
                  onClick={() => respond(ev.id, 'accepted')}
                  tone="emerald" Icon={Check} label="Accept"
                />
                <RsvpButton
                  active={status === 'tentative'} disabled={pending}
                  onClick={() => respond(ev.id, 'tentative')}
                  tone="amber" Icon={HelpCircle} label="Maybe"
                />
                <RsvpButton
                  active={status === 'declined'} disabled={pending}
                  onClick={() => respond(ev.id, 'declined')}
                  tone="rose" Icon={X} label="Decline"
                />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function RsvpButton({
  active, disabled, onClick, tone, Icon, label,
}: any) {
  const colors: any = {
    emerald: { active: 'bg-emerald-600 text-white border-emerald-600', idle: 'text-emerald-700 border-emerald-200 hover:bg-emerald-50' },
    amber:   { active: 'bg-amber-500 text-white border-amber-500',     idle: 'text-amber-700 border-amber-200 hover:bg-amber-50' },
    rose:    { active: 'bg-rose-600 text-white border-rose-600',       idle: 'text-rose-700 border-rose-200 hover:bg-rose-50' },
  }
  const cls = active ? colors[tone].active : `bg-white ${colors[tone].idle}`
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3.5 py-1.5 rounded-full border text-[12.5px] font-medium flex items-center gap-1.5 transition disabled:opacity-50 ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: any = {
    accepted: { label: 'Accepted', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    tentative: { label: 'Maybe', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    declined: { label: 'Declined', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    pending: { label: 'Pending', cls: 'bg-neutral-50 text-neutral-600 border-neutral-200' },
  }
  const m = map[status] ?? map.pending
  return (
    <span className={`text-[10.5px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${m.cls}`}>
      {m.label}
    </span>
  )
}
