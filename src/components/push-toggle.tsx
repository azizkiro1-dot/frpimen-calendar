'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'

const VAPID_PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}

export function PushToggle() {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUB
    setSupported(ok)
    if (!ok) return
    navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription().then(sub => setEnabled(!!sub)))
  }, [])

  const enable = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw-push.js')
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setBusy(false); return }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUB),
      })
      const json = JSON.parse(JSON.stringify(sub))
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) })
      setEnabled(true)
    } finally { setBusy(false) }
  }

  const disable = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) })
        await sub.unsubscribe()
      }
      setEnabled(false)
    } finally { setBusy(false) }
  }

  if (!supported) return null

  return (
    <button
      onClick={enabled ? disable : enable}
      disabled={busy}
      className="text-[12.5px] font-medium text-neutral-700 hover:text-neutral-900 px-3 py-1.5 rounded-full border border-neutral-200 hover:border-neutral-300 bg-white flex items-center gap-1.5 transition"
    >
      {enabled ? <Bell className="h-3.5 w-3.5 text-emerald-600" /> : <BellOff className="h-3.5 w-3.5" />}
      {busy ? '…' : enabled ? 'Reminders on' : 'Enable reminders'}
    </button>
  )
}
