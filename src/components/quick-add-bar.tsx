'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, X } from 'lucide-react'
import { quickAdd } from '@/app/actions/quick-add'

export function QuickAddBar() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Cmd/Ctrl + K opens
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  const submit = () => {
    if (!text.trim() || pending) return
    setError('')
    startTransition(async () => {
      const res = await quickAdd(text)
      if (res.error) setError(res.error)
      else { setText(''); setOpen(false) }
    })
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] p-4 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
            <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
            <input
              ref={inputRef}
              value={text}
              onChange={e => { setText(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder='Try "Mass tomorrow 9am at St Mary&apos;s"'
              className="flex-1 bg-transparent border-0 outline-none text-[14.5px] placeholder:text-neutral-400"
            />
            <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-[11.5px] text-neutral-500">
              Press <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono">⌘K</kbd> anytime · <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono">Enter</kbd> to add
            </p>
            <button
              onClick={submit}
              disabled={!text.trim() || pending}
              className="px-4 h-8 rounded-full bg-neutral-900 text-white text-[13px] font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-1.5"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {pending ? 'Adding…' : 'Add event'}
            </button>
          </div>
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-[12.5px] text-red-700">
              {error}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
