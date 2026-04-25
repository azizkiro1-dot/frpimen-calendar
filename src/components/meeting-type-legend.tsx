'use client'

import { motion } from 'framer-motion'

type MeetingType = { id: string; name: string; color: string }

export function MeetingTypeLegend({ types }: { types: MeetingType[] }) {
  if (!types?.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-wrap gap-1.5 px-1"
    >
      {types.map(t => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-[11.5px] font-medium text-neutral-700 shadow-sm"
        >
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: t.color }} />
          {t.name}
        </span>
      ))}
    </motion.div>
  )
}
