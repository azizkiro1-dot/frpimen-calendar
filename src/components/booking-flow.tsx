'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react'
import { DateTime } from 'luxon'
import { getAvailableSlots, bookSlot } from '@/app/actions/booking'

const TZ = 'America/Chicago'

export function BookingFlow({ slug, duration, availabilityDays }: { slug: string; duration: number; availabilityDays: number[] }) {
  const [month, setMonth] = useState(() => DateTime.now().setZone(TZ).startOf('month'))
  const [selected, setSelected] = useState<string | null>(null)  // yyyy-LL-dd
  const [time, setTime] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'date' | 'time' | 'form' | 'done'>('date')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    getAvailableSlots(slug, selected).then(s => { setSlots(s); setLoading(false) })
  }, [selected, slug])

  const days = Array.from({ length: month.daysInMonth! }, (_, i) => month.set({ day: i + 1 }))
  const offset = (month.weekday + 6) % 7  // make Sunday first

  const submit = async () => {
    if (!selected || !time || !name || !email) return
    setSubmitting(true); setError('')
    const r = await bookSlot(slug, selected, time, name, email, notes)
    if ((r as any)?.error) { setError((r as any).error); setSubmitting(false) }
    else { setStep('done'); setSubmitting(false) }
  }

  if (step === 'done') {
    const dt = DateTime.fromISO(`${selected}T${time}`, { zone: TZ })
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="p-8 sm:p-10 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Check className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Booked</h2>
        <p className="text-[14px] text-neutral-600 mt-2">{dt.toFormat('cccc, LLLL d')} at {dt.toFormat('h:mm a')}</p>
        <p className="text-[13px] text-neutral-500 mt-3">A confirmation will be sent to {email}.</p>
      </motion.div>
    )
  }

  return (
    <div className="p-5 sm:p-7">
      <AnimatePresence mode="wait">
        {step === 'date' && (
          <motion.div key="date" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setMonth(month.minus({ months: 1 }))} className="h-8 w-8 rounded-full hover:bg-neutral-100 flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button>
              <h3 className="font-semibold text-[15px]">{month.toFormat('LLLL yyyy')}</h3>
              <button onClick={() => setMonth(month.plus({ months: 1 }))} className="h-8 w-8 rounded-full hover:bg-neutral-100 flex items-center justify-center"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-2">
              {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }, (_, i) => <div key={`pad-${i}`} />)}
              {days.map(d => {
                const k = d.toFormat('yyyy-LL-dd')
                const past = d < DateTime.now().setZone(TZ).startOf('day')
                const wd = d.weekday
                const available = !past && availabilityDays.includes(wd)
                const isSel = selected === k
                return (
                  <button
                    key={k}
                    disabled={!available}
                    onClick={() => { setSelected(k); setTime(null); setStep('time') }}
                    className={`aspect-square rounded-full text-[13.5px] font-medium transition ${
                      isSel ? 'bg-neutral-900 text-white' :
                      available ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold' :
                      'text-neutral-300 cursor-not-allowed'
                    }`}
                  >
                    {d.day}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 'time' && selected && (
          <motion.div key="time" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
            <button onClick={() => setStep('date')} className="text-[12.5px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1 mb-3">
              <ChevronLeft className="h-3.5 w-3.5" /> Change date
            </button>
            <h3 className="font-semibold text-[15px]">{DateTime.fromISO(selected).toFormat('cccc, LLLL d')}</h3>
            <p className="text-[12.5px] text-neutral-500 mt-1">{duration} min · America/Chicago</p>
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-neutral-400" /></div>
            ) : slots.length === 0 ? (
              <p className="py-10 text-center text-[13.5px] text-neutral-500">No times available this day</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto">
                {slots.map(s => {
                  const dt = DateTime.fromFormat(s, 'HH:mm')
                  const active = time === s
                  return (
                    <button
                      key={s}
                      onClick={() => { setTime(s); setStep('form') }}
                      className={`h-10 rounded-xl border text-[13.5px] font-medium transition ${
                        active ? 'bg-neutral-900 text-white border-neutral-900' :
                        'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {dt.toFormat('h:mm a')}
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {step === 'form' && selected && time && (
          <motion.div key="form" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
            <button onClick={() => setStep('time')} className="text-[12.5px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1 mb-3">
              <ChevronLeft className="h-3.5 w-3.5" /> Change time
            </button>
            <h3 className="font-semibold text-[15px]">Your details</h3>
            <p className="text-[12.5px] text-neutral-500 mt-1">{DateTime.fromISO(`${selected}T${time}`).toFormat('cccc, LLLL d · h:mm a')}</p>
            <div className="space-y-3 mt-4">
              <Field label="Name" value={name} onChange={setName} required />
              <Field label="Email" value={email} onChange={setEmail} type="email" required />
              <Field label="Notes (optional)" value={notes} onChange={setNotes} multiline />
              {error && <p className="text-[13px] text-red-700">{error}</p>}
              <button
                onClick={submit}
                disabled={!name || !email || submitting}
                className="w-full h-11 rounded-full bg-neutral-900 text-white font-medium text-[14px] hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ label, value, onChange, type, required, multiline }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; multiline?: boolean }) {
  return (
    <label className="block">
      <span className="text-[11.5px] uppercase tracking-wide text-neutral-500 font-medium">{label}{required && <span className="text-red-600 ml-0.5">*</span>}</span>
      {multiline ? (
        <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-400 text-[14px] resize-none" />
      ) : (
        <input type={type ?? 'text'} value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-400 text-[14px]" />
      )}
    </label>
  )
}
