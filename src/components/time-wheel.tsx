'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'

type Props = {
  value: string  // HH:mm 24h
  onChange: (v: string) => void
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1)
const MINS = Array.from({ length: 12 }, (_, i) => i * 5)

function parse(value: string): { h: number; m: number; p: 'AM' | 'PM' } {
  const [hh, mm] = (value || '09:00').split(':').map(Number)
  const period: 'AM' | 'PM' = hh >= 12 ? 'PM' : 'AM'
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh
  return { h: h12, m: mm || 0, p: period }
}

function combine(h: number, m: number, p: 'AM' | 'PM'): string {
  let h24 = h % 12
  if (p === 'PM') h24 += 12
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fmt12(value: string): string {
  const { h, m, p } = parse(value)
  return `${h}:${String(m).padStart(2, '0')} ${p}`
}

export function TimeWheel({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { h, m, p } = parse(value)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="h-8 px-3 text-[13px] bg-neutral-100 hover:bg-neutral-200 rounded-md tabular-nums font-medium flex items-center gap-1.5"
      >
        <Clock className="h-3 w-3 opacity-50" />
        {fmt12(value)}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-neutral-200 p-2 flex gap-1"
          >
            <Col items={HOURS_12}    selected={h}    onPick={n => onChange(combine(n, m, p))} format={n => String(n)} />
            <span className="self-center text-neutral-300 px-0.5">:</span>
            <Col items={MINS}        selected={m}    onPick={n => onChange(combine(h, n, p))} format={n => String(n).padStart(2, '0')} />
            <Col items={['AM','PM']} selected={p}    onPick={(v: any) => onChange(combine(h, m, v))} format={v => v} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Col<T extends string | number>({
  items, selected, onPick, format,
}: { items: T[]; selected: T; onPick: (v: T) => void; format: (v: T) => string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const i = items.indexOf(selected)
    if (i >= 0) ref.current.scrollTop = i * 32 - 32
  }, [selected, items])

  return (
    <div ref={ref} className="relative h-[160px] w-[60px] overflow-y-auto rounded-xl bg-neutral-50 scrollbar-hide">
      <div className="py-[64px]">
        {items.map((it, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(it)}
            className={`block w-full h-8 text-[14px] tabular-nums transition ${
              it === selected ? 'font-semibold text-neutral-900 bg-white rounded-lg shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {format(it)}
          </button>
        ))}
      </div>
      <div className="absolute inset-x-0 top-0 h-[64px] bg-gradient-to-b from-neutral-50 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[64px] bg-gradient-to-t from-neutral-50 to-transparent pointer-events-none" />
    </div>
  )
}
