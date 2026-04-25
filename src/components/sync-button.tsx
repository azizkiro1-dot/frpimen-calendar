'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { syncGoogleCalendar } from '@/app/actions/sync'

export function SyncButton() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const handleSync = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await syncGoogleCalendar()
      if (result.error) {
        setMessage(`❌ ${result.error}`)
      } else {
        setMessage(`✅ Synced ${result.count} events`)
      }
      setTimeout(() => setMessage(null), 4000)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleSync} disabled={isPending}>
        <RefreshCw className={`h-4 w-4 sm:mr-2 ${isPending ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{isPending ? 'Syncing…' : 'Sync Google'}</span>
      </Button>
      {message && (
        <span className="text-xs text-slate-600 hidden md:inline">{message}</span>
      )}
    </div>
  )
}