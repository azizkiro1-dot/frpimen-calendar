'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Copy, Check, Link as LinkIcon, Clock, MapPin } from 'lucide-react'
import { createBookingLink, deleteBookingLink } from '@/app/actions/booking'

const PRESETS = [
  { name: 'Confession',      duration: 15, desc: '15-min confession slots' },
  { name: 'Quick meeting',   duration: 15, desc: 'Quick chat or check-in' },
  { name: 'Service meeting', duration: 30, desc: 'Half-hour service planning' },
  { name: '1-on-1',          duration: 30, desc: 'One-on-one meeting' },
  { name: 'Group meeting',   duration: 60, desc: 'Group meeting or council' },
]

type Link = {
  id: string; slug: string; name: string; duration_minutes: number;
  location: string | null; active: boolean; max_per_day: number | null
}

type MType = { id: string; name: string; color: string }

export function BookingLinksPanel({ links, meetingTypes, defaultLocation }: { links: Link[]; meetingTypes: MType[]; defaultLocation: string }) {
  const [pending, startTransition] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', duration_minutes: 30, location: defaultLocation || '',
    meeting_type_id: '', availability_start: '09:00', availability_end: '17:00',
    max_per_day: '' as string,
  })

  const submit = () => {
    if (!form.name.trim()) return
    startTransition(async () => {
      await createBookingLink({
        name: form.name,
        slug: form.name,
        duration_minutes: form.duration_minutes,
        location: form.location || undefined,
        meeting_type_id: form.meeting_type_id || null,
        availability_start: form.availability_start,
        availability_end: form.availability_end,
        max_per_day: form.max_per_day ? parseInt(form.max_per_day) : null,
      })
      setShowNew(false)
      setForm({ name: '', duration_minutes: 30, location: defaultLocation || '', meeting_type_id: '', availability_start: '09:00', availability_end: '17:00', max_per_day: '' })
    })
  }

  const usePreset = (p: typeof PRESETS[number]) => {
    setForm({ ...form, name: p.name, duration_minutes: p.duration })
    setShowNew(true)
  }

  const copyUrl = async (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`
    await navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-3">
      {!showNew && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => usePreset(p)}
                className="text-left p-3 rounded-2xl border border-dashed border-neutral-300 hover:border-neutral-500 bg-white hover:bg-neutral-50 transition"
              >
                <p className="font-semibold text-[14px] text-neutral-900">{p.name}</p>
                <p className="text-[12px] text-neutral-600 mt-0.5">{p.desc}</p>
                <p className="text-[11px] text-neutral-500 mt-1.5">⏱ {p.duration} min</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="w-full p-3.5 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-500 text-[13.5px] text-neutral-600 hover:text-neutral-900 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Custom link
          </button>
        </>
      )}

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
            <h3 className="font-semibold text-[15px]">New booking link</h3>
            <Input label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Confession" />
            <div className="grid grid-cols-2 gap-3">
              <NumInput label="Duration (min)" value={form.duration_minutes} onChange={v => setForm({ ...form, duration_minutes: v })} />
              <NumInput label="Max bookings/day" value={form.max_per_day === '' ? 0 : parseInt(form.max_per_day)} onChange={v => setForm({ ...form, max_per_day: v ? String(v) : '' })} />
            </div>
            <Input label="Location" value={form.location} onChange={v => setForm({ ...form, location: v })} placeholder="205 S Church St, Prosper, TX 75078" />
            <Select label="Meeting type" value={form.meeting_type_id} onChange={v => setForm({ ...form, meeting_type_id: v })}>
              <option value="">No type</option>
              {meetingTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Day starts" value={form.availability_start} onChange={v => setForm({ ...form, availability_start: v })} placeholder="09:00" />
              <Input label="Day ends"   value={form.availability_end}   onChange={v => setForm({ ...form, availability_end: v })}   placeholder="17:00" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNew(false)} className="text-[13px] px-4 py-2 rounded-full text-neutral-600 hover:bg-neutral-100">Cancel</button>
              <button onClick={submit} disabled={pending} className="text-[13px] px-4 py-2 rounded-full bg-neutral-900 text-white hover:bg-neutral-800">{pending ? 'Saving…' : 'Create'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {links.length === 0 && !showNew && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <LinkIcon className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
          <p className="text-sm text-neutral-600">No booking links yet</p>
        </div>
      )}

      {links.map(l => (
        <motion.div key={l.id} layout className="bg-white rounded-2xl border border-neutral-200 p-4 group">
          <div className="flex items-start gap-3">
            <span className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <LinkIcon className="h-4 w-4 text-blue-600" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14.5px]">{l.name}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[12px] text-neutral-500">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {l.duration_minutes} min</span>
                {l.location && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {l.location}</span>}
              </div>
              <p className="text-[11.5px] text-neutral-400 font-mono mt-1.5 truncate">/book/{l.slug}</p>
            </div>
            <button
              onClick={() => copyUrl(l.slug)}
              className="text-[12.5px] font-medium px-3 py-1.5 rounded-full border border-neutral-200 bg-white hover:border-neutral-300 flex items-center gap-1.5"
            >
              {copied === l.slug ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              {copied === l.slug ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={() => startTransition(() => { deleteBookingLink(l.id) })}
              className="opacity-0 group-hover:opacity-100 transition h-7 w-7 rounded-md flex items-center justify-center hover:bg-red-50 text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11.5px] uppercase tracking-wide text-neutral-500 font-medium">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
             className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-400 text-[14px]" />
    </label>
  )
}
function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-[11.5px] uppercase tracking-wide text-neutral-500 font-medium">{label}</span>
      <input type="number" min={0} value={value || ''} onChange={e => onChange(parseInt(e.target.value || '0'))}
             className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-400 text-[14px]" />
    </label>
  )
}
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11.5px] uppercase tracking-wide text-neutral-500 font-medium">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-400 text-[14px] bg-white">
        {children}
      </select>
    </label>
  )
}
