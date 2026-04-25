'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Cross } from 'lucide-react'
import { feastsOn, type FeastEntry } from '@/lib/liturgical/coptic'
import { DateTime } from 'luxon'

const TZ = 'America/Chicago'

export function LiturgicalBanner() {
  const today = useMemo(() => DateTime.now().setZone(TZ).toJSDate(), [])
  const feasts = useMemo(() => feastsOn(today), [today])
  if (!feasts.length) return null
  const main = feasts.find(f => f.rank === 'major') ?? feasts[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 flex items-center gap-3 shadow-sm"
    >
      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
           style={{ background: hexToRgba(main.color, 0.14), color: main.color }}>
        <Cross className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
          {main.rank === 'major' ? 'Major feast' : main.rank === 'fast' ? 'Fasting period' : main.rank}
        </p>
        <p className="text-[14.5px] font-semibold text-neutral-900 truncate">{main.name}</p>
        {main.desc && <p className="text-[12px] text-neutral-600 truncate">{main.desc}</p>}
      </div>
      {feasts.length > 1 && (
        <span className="text-[11px] text-neutral-500 shrink-0">+{feasts.length - 1} more</span>
      )}
    </motion.div>
  )
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${a})`
}
