'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, Clock, Trash2, Plus, Moon, X } from 'lucide-react'
import { DateTime } from 'luxon'
import { createRangeBlock, createDailyBlock, deleteBlock } from '@/app/actions/blocks'

const TZ = 'America/Chicago'

type Block = {
  id: string; kind: 'range' | 'recurring_daily';
  starts_at: string | null; ends_at: string | null;
  daily_start: string | null; daily_end: string | null;
  weekdays: number[] | null; reason: string | null
}

const PRESETS = [
  { kind: 'daily', label: 'Quiet hours (12am–6am)', daily_start: '00:00', daily_end: '06:00', icon: Moon },
  { kind: 'daily', label: 'Lunch (12pm–1pm)',        daily_start: '12:00', daily_end: '13:00', icon: Clock },
  { kind: 'range', label: 'Vacation (next 7 days)',  days: 7, icon: Plane },
]

export function BlocksPanel({ blocks }: { blocks: Block[] }) {
  const [pending, startTransition] = useTransition()
  const [showRange, setShowRange] = useState(false)
  const [showDaily, setShowDaily] = useState(false)
  const [range, setRange] = useState({ start: '', end: '', reason: '' })
  const [daily, setDaily] = useState({ start: '00:00', end: '06:00', reason: '', weekdays: [1,2,3,4,5,6,7] })

  const submitRange = () => {
    if (!range.start || !range.end) return
    const s = DateTime.fromISO(range.start, { zone: TZ }).startOf('day').toUTC().toISO()!
    const e = DateTime.fromISO(range.end, { zone: TZ }).endOf('day').toUTC().toISO()!
    startTransition(async () => {
      await createRangeBlock(s, e, range.reason)
      setShowRange(false); setRange({ start: '', end: '', reason: '' })
    })
  }
  const submitDaily = () => {
    startTransition(async () => {
      await createDailyBlock(daily.start, daily.end, daily.weekdays, daily.reason)
      setShowDaily(false); setDaily({ start: '00:00', end: '06:00', reason: '', weekdays: [1,2,3,4,5,6,7] })
    })
  }

  const usePreset = (p: any) => {
    if (p.kind === 'daily') {
      setDaily({ ...daily, start: p.daily_start, end: p.daily_end, reason: p.label })
      setShowDaily(true)
    } else {
      const s = DateTime.now().setZone(TZ).toFormat('yyyy-LL-dd')
      const e = DateTime.now().setZone(TZ).plus({ days: p.days - 1 }).toFormat('yyyy-LL-dd')
      setRange({ start: s, end: e, reason: p.label })
      setShowRange(true)
    }
  }

  return (
    <div className="space-y-3">
      {!showRange && !showDaily && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESETS.map(p => {
            const Icon = p.icon
            return (
              <button key={p.label} onClick={() => usePreset(p)}
                      className="text-left p-3 rounded-2xl border border-dashed border-neutral-300 hover:border-neutral-500 bg-white hover:bg-neutral-50 transition flex items-start gap-2.5">
                <Icon className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
                <span className="text-[13.5px] font-medium text-neutral-900">{p.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {!showRange && !showDaily && (
        <div className="grid sm:grid-cols-2 gap-2">
          <button onClick={() => setShowRange(true)}
                  className="p-3.5 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-500 text-[13.5px] text-neutral-700 hover:text-neutral-900 flex items-center justify-center gap-2">
            <Plane className="h-4 w-4" /> Block date range
          </button>
          <button onClick={() => setShowDaily(true)}
                  className="p-3.5 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-500 text-[13.5px] text-neutral-700 hover:text-neutral-900 flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" /> Daily quiet hours
          </button>
        </div>
      )}

      <AnimatePresence>
        {showRange && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
            <h3 className="font-semibold text-[15px]">Vacation / days off</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" type="date" value={range.start} onChange={v => setRange({ ...range, start: v })} />
              <Field label="End"   type="date" value={range.end}   onChange={v => setRange({ ...range, end: v })} />
            </div>
            <Field label="Reason (optional)" value={range.reason} onChange={v => setRange({ ...range, reason: v })} placeholder="Family vacation" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowRange(false)} className="text-[13px] px-4 py-2 rounded-full text-neutral-600 hover:bg-neutral-100">Cancel</button>
              <button onClick={submitRange} disabled={pending} className="text-[13px] px-4 py-2 rounded-full bg-neutral-900 text-white hover:bg-neutral-800">{pending ? '…' : 'Block off'}</button>
            </div>
          </motion.div>
        )}
        {showDaily && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
            <h3 className="font-semibold text-[15px]">Daily quiet hours</h3>
            <p className="text-[12px] text-neutral-500">Repeats every day. Parishioners can't book during these hours.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" type="time" value={daily.start} onChange={v => setDaily({ ...daily, start: v })} />
              <Field label="Until" type="time" value={daily.end} onChange={v => setDaily({ ...daily, end: v })} />
            </div>
            <div>
              <p className="text-[11.5px] uppercase tracking-wide text-neutral-500 font-medium mb-1.5">Days</p>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: 1, l: 'M' }, { id: 2, l: 'T' }, { id: 3, l: 'W' }, { id: 4, l: 'T' },
                  { id: 5, l: 'F' }, { id: 6, l: 'S' }, { id: 7, l: 'S' },
                ].map(d => {
                  const active = daily.weekdays.includes(d.id)
                  return (
                    <button key={d.id}
                      onClick={() => setDaily({ ...daily, weekdays: active ? daily.weekdays.filter(x => x !== d.id) : [...daily.weekdays, d.id] })}
                      className={`h-8 w-8 rounded-full text-[12.5px] font-semibold border ${
                        active ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-neutral-200'
                      }`}
                    >{d.l}</button>
                  )
                })}
              </div>
            </div>
            <Field label="Reason (optional)" value={daily.reason} onChange={v => setDaily({ ...daily, reason: v })} placeholder="Sleep / family time" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowDaily(false)} className="text-[13px] px-4 py-2 rounded-full text-neutral-600 hover:bg-neutral-100">Cancel</button>
              <button onClick={submitDaily} disabled={pending} className="text-[13px] px-4 py-2 rounded-full bg-neutral-900 text-white hover:bg-neutral-800">{pending ? '…' : 'Save'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {blocks.length === 0 && !showRange && !showDaily && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <Plane className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
          <p className="text-sm text-neutral-600">No blocks yet</p>
        </div>
      )}

      {blocks.map(b => {
        const Icon = b.kind === 'range' ? Plane : Clock
        let label = ''
        if (b.kind === 'range' && b.starts_at && b.ends_at) {
          const s = DateTime.fromISO(b.starts_at, { zone: 'utc' }).setZone(TZ)
          const e = DateTime.fromISO(b.ends_at, { zone: 'utc' }).setZone(TZ)
          label = `${s.toFormat('LLL d')} → ${e.toFormat('LLL d, yyyy')}`
        }
        if (b.kind === 'recurring_daily') {
          const days = b.weekdays ?? [1,2,3,4,5,6,7]
          const dayLabels = days.length === 7 ? 'Daily' : days.map(d => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d-1]).join(', ')
          label = `${b.daily_start} – ${b.daily_end} · ${dayLabels}`
        }
        return (
          <motion.div key={b.id} layout className="bg-white rounded-2xl border border-neutral-200 p-4 group flex items-start gap-3">
            <span className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14.5px] text-neutral-900">{b.reason || (b.kind === 'range' ? 'Time off' : 'Quiet hours')}</p>
              <p className="text-[12.5px] text-neutral-500 mt-0.5">{label}</p>
            </div>
            <button onClick={() => startTransition(() => { deleteBlock(b.id) })}
                    className="opacity-0 group-hover:opacity-100 transition h-7 w-7 rounded-md flex items-center justify-center hover:bg-red-50 text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}

function Field({ label, value, onChange, type, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11.5px] uppercase tracking-wide text-neutral-500 font-medium">{label}</span>
      <input type={type ?? 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
             className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-400 text-[14px]" />
    </label>
  )
}
