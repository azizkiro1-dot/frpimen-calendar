'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, CalendarRange, Calendar, X } from 'lucide-react'

type Scope = 'occurrence' | 'future' | 'series'

export function RecurringDeleteModal({
  open, onClose, onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (scope: Scope) => void
}) {
  if (!open) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-semibold text-[15px]">Delete recurring event</h3>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-3 space-y-1.5">
            <Choice icon={CalendarDays} label="This occurrence only" desc="Just this date" onClick={() => onConfirm('occurrence')} />
            <Choice icon={CalendarRange} label="This and future"     desc="Stop the series here" onClick={() => onConfirm('future')} />
            <Choice icon={Calendar}      label="Entire series"        desc="All past + future" tone="red" onClick={() => onConfirm('series')} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Choice({ icon: Icon, label, desc, tone, onClick }: any) {
  const ctx = tone === 'red'
    ? 'hover:bg-red-50 text-red-700'
    : 'hover:bg-neutral-50 text-neutral-900'
  return (
    <button onClick={onClick} className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition ${ctx}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="text-[13.5px] font-medium">{label}</p>
        <p className={`text-[11.5px] ${tone === 'red' ? 'text-red-600' : 'text-neutral-500'}`}>{desc}</p>
      </div>
    </button>
  )
}
