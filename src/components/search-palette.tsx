'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Calendar, CheckSquare, X } from 'lucide-react'
import Link from 'next/link'
import { searchAll, type SearchHit } from '@/app/actions/search'

export function SearchPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  useEffect(() => {
    if (!q.trim()) { setHits([]); return }
    let cancelled = false
    setLoading(true)
    const t = setTimeout(async () => {
      const r = await searchAll(q)
      if (!cancelled) { setHits(r); setLoading(false) }
    }, 220)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
            <Search className="h-4 w-4 text-neutral-400 shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search events and tasks..."
              className="flex-1 bg-transparent border-0 outline-none text-[14.5px] placeholder:text-neutral-400"
            />
            <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {q.trim().length > 0 && q.trim().length < 2 && (
              <p className="px-5 py-6 text-[13px] text-neutral-500">Type at least 2 characters</p>
            )}
            {q.trim().length >= 2 && hits.length === 0 && !loading && (
              <p className="px-5 py-6 text-[13px] text-neutral-500">No matches</p>
            )}
            {hits.map((h, i) => {
              const Icon = h.type === 'event' ? Calendar : CheckSquare
              return (
                <Link key={`${h.type}-${h.id}`} href={h.href} onClick={() => setOpen(false)}>
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.015 }}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0"
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${h.type === 'event' ? 'text-blue-500' : 'text-emerald-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-neutral-900 truncate">{h.title}</p>
                      <p className="text-[12px] text-neutral-500 truncate">{h.subtitle}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">{h.type}</span>
                  </motion.div>
                </Link>
              )
            })}
          </div>
          <div className="px-4 py-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span>
              <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded font-mono">⌘/</kbd> to open
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded font-mono">⌘K</kbd> to quick-add
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
