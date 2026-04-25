'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CheckSquare, MessageSquare, Bell, Sparkles, X } from 'lucide-react'

const STEPS = [
  { icon: Sparkles,      title: 'Welcome', body: "This calendar is built for you. Let me show you around quickly." },
  { icon: Calendar,      title: 'Calendar', body: 'Tap "+ New" to add an event. Switch between Month, Week, Day, and Agenda from the toolbar.' },
  { icon: CheckSquare,   title: 'Tasks', body: 'Track action items with priority and due dates. Cards are color-coded.' },
  { icon: MessageSquare, title: 'Assistant', body: "Ask 'What do I have today?' or 'Find conflicts this week.' Powered by Claude." },
  { icon: Bell,          title: 'Notifications', body: 'Daily 7am summary email. Enable push reminders from Settings.' },
]

export function OnboardingTour() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem('frpimen_onboarded')
    if (!seen) {
      // Seed default meeting types on first run
      fetch('/api/onboarding/seed', { method: 'POST' }).catch(() => {})
      setOpen(true)
    }
  }, [])

  const close = () => {
    localStorage.setItem('frpimen_onboarded', '1')
    setOpen(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
    else close()
  }

  if (!open) return null
  const s = STEPS[step]
  const Icon = s.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={close}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          className="relative max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 h-8 w-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500"
            aria-label="Skip"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="px-7 pt-9 pb-7">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-violet-500 flex items-center justify-center shadow-lg">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold mt-4 tracking-tight">{s.title}</h2>
              <p className="text-[14.5px] text-neutral-600 mt-2 leading-relaxed">{s.body}</p>
            </motion.div>
            <div className="mt-6 flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-neutral-900' : 'w-1.5 bg-neutral-300'}`}
                />
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button onClick={close} className="text-[13.5px] text-neutral-500 hover:text-neutral-900">Skip</button>
              <button
                onClick={next}
                className="px-5 h-10 rounded-full bg-neutral-900 text-white text-[14px] font-medium hover:bg-neutral-800"
              >
                {step < STEPS.length - 1 ? 'Next' : 'Get started'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
