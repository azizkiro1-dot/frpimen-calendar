'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { createMeetingType, updateMeetingType, deleteMeetingType } from '@/app/actions/meeting-types'

const PRESET_COLORS = [
  '#dc2626','#ea580c','#f59e0b','#84cc16','#10b981','#06b6d4',
  '#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#737373','#0a0a0a',
]

type MType = { id: string; name: string; color: string; default_duration_minutes: number; category: string }

export function MeetingTypesPanel({ types }: { types: MType[] }) {
  const [pending, startTransition] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', color: PRESET_COLORS[0], duration: 60 })

  const submit = () => {
    if (!form.name.trim()) return
    startTransition(async () => {
      if (editing) {
        await updateMeetingType(editing, { name: form.name, color: form.color, default_duration_minutes: form.duration })
      } else {
        await createMeetingType({ name: form.name, color: form.color, default_duration_minutes: form.duration })
      }
      setShowNew(false); setEditing(null); setForm({ name: '', color: PRESET_COLORS[0], duration: 60 })
    })
  }

  const seedDefaults = () => {
    startTransition(async () => {
      await fetch('/api/onboarding/seed', { method: 'POST' })
      window.location.reload()
    })
  }

  const startEdit = (t: MType) => {
    setEditing(t.id); setShowNew(true)
    setForm({ name: t.name, color: t.color, duration: t.default_duration_minutes })
  }

  return (
    <div className="space-y-3">
      {!showNew && (
        <button onClick={() => { setEditing(null); setShowNew(true); setForm({ name: '', color: PRESET_COLORS[0], duration: 60 }) }}
                className="w-full p-3.5 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-500 text-[13.5px] text-neutral-700 hover:text-neutral-900 flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> New meeting type
        </button>
      )}

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[15px]">{editing ? 'Edit type' : 'New type'}</h3>
              <button onClick={() => { setShowNew(false); setEditing(null) }} className="text-neutral-400 hover:text-neutral-700"><X className="h-4 w-4" /></button>
            </div>
            <label className="block">
              <span className="text-[11.5px] uppercase tracking-wide text-neutral-500 font-medium">Name</span>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mass"
                     className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-400 text-[14px]" />
            </label>
            <div>
              <p className="text-[11.5px] uppercase tracking-wide text-neutral-500 font-medium mb-2">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                          className={`h-8 w-8 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 ring-neutral-900' : ''}`}
                          style={{ background: c }} />
                ))}
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                       className="h-8 w-14 rounded cursor-pointer border border-neutral-200" />
              </div>
            </div>
            <label className="block">
              <span className="text-[11.5px] uppercase tracking-wide text-neutral-500 font-medium">Default duration (minutes)</span>
              <input type="number" min={5} step={5} value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value || '0') })}
                     className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-400 text-[14px]" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowNew(false); setEditing(null) }} className="text-[13px] px-4 py-2 rounded-full text-neutral-600 hover:bg-neutral-100">Cancel</button>
              <button onClick={submit} disabled={pending} className="text-[13px] px-4 py-2 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5" /> {pending ? 'Saving…' : editing ? 'Save' : 'Create'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {types.length === 0 && !showNew && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
          <p className="text-sm text-neutral-600 mb-3">No meeting types yet.</p>
          <button onClick={seedDefaults} className="text-[13px] font-medium px-4 py-2 rounded-full bg-neutral-900 text-white hover:bg-neutral-800">
            Add 9 default types (Mass, Confession, Baptism, Wedding, Funeral, Counseling, Hospital visit, Meeting, Personal)
          </button>
        </div>
      )}

      {types.map(t => (
        <motion.div key={t.id} layout className="bg-white rounded-2xl border border-neutral-200 p-3.5 group flex items-center gap-3">
          <span className="h-7 w-7 rounded-lg shrink-0" style={{ background: t.color }} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px]">{t.name}</p>
            <p className="text-[12px] text-neutral-500">⏱ {t.default_duration_minutes} min</p>
          </div>
          <button onClick={() => startEdit(t)} className="opacity-0 group-hover:opacity-100 transition h-8 w-8 rounded-md hover:bg-neutral-100 flex items-center justify-center text-neutral-600">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => startTransition(() => { deleteMeetingType(t.id) })}
                  className="opacity-0 group-hover:opacity-100 transition h-8 w-8 rounded-md hover:bg-red-50 flex items-center justify-center text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      ))}
    </div>
  )
}
