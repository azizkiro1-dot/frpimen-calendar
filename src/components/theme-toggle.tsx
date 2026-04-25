'use client'

import { motion } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

const OPTIONS: { id: 'light' | 'dark' | 'system'; icon: any; label: string }[] = [
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'system', icon: Monitor, label: 'Auto' },
  { id: 'dark', icon: Moon, label: 'Dark' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="inline-flex items-center bg-neutral-100 rounded-full p-1 gap-0.5">
      {OPTIONS.map(o => {
        const Icon = o.icon
        const active = theme === o.id
        return (
          <motion.button
            key={o.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(o.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium transition ${
              active ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {o.label}
          </motion.button>
        )
      })}
    </div>
  )
}
