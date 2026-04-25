'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, FileText, Clock, MapPin, Save } from 'lucide-react'
import { createTemplate, deleteTemplate } from '@/app/actions/templates'

type Template = {
  id: string
  name: string
  title: string
  description: string | null
  location: string | null
  default_duration_minutes: number
  meeting_type_id: string | null
  rrule: string | null
}

type MType = { id: string; name: string; color: string }

export function TemplatesPanel({ templates, meetingTypes }: { templates: Template[]; meetingTypes: MType[] }) {
  const [showNew, setShowNew] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '', title: '', location: '', description: '',
    default_duration_minutes: 60, meeting_type_id: '',
  })
  const colorOf = (id: string | null) => meetingTypes.find(m => m.id === id)?.color ?? '#737373'

  const submit = () => {
    if (!form.name.trim() || !form.title.trim()) return
    startTransition(async () => {
      const res = await createTemplate({
        name: form.name,
        title: form.title,
        location: form.location || null,
        description: form.description || null,
        default_duration_minutes: form.default_duration_minutes,
        meeting_type_id: form.meeting_type_id || null,
      })
      if (!(res as any)?.error) {
        setShowNew(false)
        setForm({ name: '', title: '', location: '', description: '', default_duration_minutes: 60, meeting_type_id: '' })
      }
    })
  }

  return (
    <div className="space-y-3">
      {!showNew && (
        <button
          onClick={() => setShowNew(true)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 text-[14px] text-neutral-600 hover:text-neutral-900 flex items-center justify-center gap-2 transition"
        >
          <Plus className="h-4 w-4" /> New template
        </button>
      )}

      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3"
          >
            <h3 className="font-semibold text-[15px]">New template</h3>
            <Input label="Template name"        value={form.name}     onChange={v => setForm({ ...form, name: v })}     placeholder="Sunday Mass" />
            <Input label="Event title"          value={form.title}    onChange={v => setForm({ ...form, title: v })}    placeholder="Mass" />
            <Input label="Location"             value={form.location} onChange={v => setForm({ ...form, location: v })} placeholder="St Mary's" />
            <Input label="Notes"                value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Optional" />
            <div className="grid grid-cols-2 gap-3">
              <NumInput label="Duration (min)" value={form.default_duration_minutes} onChange={v => setForm({ ...form, default_duration_minutes: v })} />
              <SelectField label="Type" value={form.meeting_type_id} onChange={v => setForm({ ...form, meeting_type_id: v })}>
                <option value="">No type</option>
                {meetingTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </SelectField>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowNew(false)} className="text-[13px] px-4 py-2 rounded-full text-neutral-600 hover:bg-neutral-100">Cancel</button>
              <button onClick={submit} disabled={pending} className="text-[13px] px-4 py-2 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5" /> {pending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {templates.length === 0 && !showNew && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <FileText className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
          <p className="text-sm text-neutral-600">No templates yet</p>
        </div>
      )}

      {templates.map(t => (
        <motion.div
          key={t.id}
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-neutral-200 p-4 group"
        >
          <div className="flex items-start gap-3">
            <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${colorOf(t.meeting_type_id)}22`, color: colorOf(t.meeting_type_id) }}>
              <FileText className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14.5px] text-neutral-900">{t.name}</p>
              <p className="text-[12.5px] text-neutral-600">{t.title}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[11.5px] text-neutral-500">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t.default_duration_minutes} min</span>
                {t.location && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {t.location}</span>}
              </div>
            </div>
            <button
              onClick={() => startTransition(() => { deleteTemplate(t.id) })}
              className="opacity-0 group-hover:opacity-100 transition h-7 w-7 rounded-md flex items-center justify-center hover:bg-red-50 text-red-600"
              aria-label="Delete"
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
      <input type="number" min={5} step={5} value={value} onChange={e => onChange(parseInt(e.target.value || '0'))}
             className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-400 text-[14px]" />
    </label>
  )
}
function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
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
