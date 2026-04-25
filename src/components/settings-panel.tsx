'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Bell, Trash2, AlertTriangle, Mail, User, Palette, MapPin, Save as SaveIcon } from 'lucide-react'
import { setDefaultLocation } from '@/app/actions/profile'
import { ThemeToggle } from '@/components/theme-toggle'
import { PushToggle } from '@/components/push-toggle'

export function SettingsPanel({ email, name, defaultLocation = '' }: { email: string; name: string; defaultLocation?: string }) {
  const [busy, setBusy] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [error, setError] = useState('')

  const exportData = async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/account/export')
      if (!r.ok) throw new Error('Export failed')
      const blob = await r.blob()
      const u = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = u
      a.download = `frpimen-calendar-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(u)
    } catch (e: any) { setError(e.message) }
    finally { setBusy(false) }
  }

  const deleteAccount = async () => {
    if (confirmText !== 'DELETE') return
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j.error ?? 'Delete failed')
      }
      window.location.href = '/login'
    } catch (e: any) { setError(e.message); setBusy(false) }
  }

  return (
    <div className="space-y-4">
      {/* Account */}
      <Card>
        <SectionHead icon={User} title="Account" />
        <div className="px-5 py-4 space-y-2 text-[14px]">
          <Row label="Name"  value={name || '—'} />
          <Row label="Email" value={email} mono />
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <SectionHead icon={Palette} title="Appearance" />
        <div className="px-5 py-4 flex items-center justify-between">
          <span className="text-[14px] text-neutral-700">Theme</span>
          <ThemeToggle />
        </div>
      </Card>

      {/* Default location */}
      <Card>
        <SectionHead icon={MapPin} title="Default location" />
        <div className="px-5 py-4">
          <p className="text-[13px] text-neutral-600 mb-3">
            Pre-fills the location field on new events.
          </p>
          <DefaultLocationField initial={defaultLocation} />
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <SectionHead icon={Bell} title="Notifications" />
        <div className="px-5 py-4 space-y-3">
          <Row label="Daily summary email" value="7am every day" />
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-neutral-700">15-min push reminders</span>
            <PushToggle />
          </div>
        </div>
      </Card>

      {/* Data */}
      <Card>
        <SectionHead icon={Download} title="Your data" />
        <div className="px-5 py-4">
          <p className="text-[13px] text-neutral-600 mb-3">
            Download all your events, tasks, sharing, and chat history as JSON.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={exportData}
            disabled={busy}
            className="text-[13px] font-medium text-neutral-700 hover:text-neutral-900 px-4 py-2 rounded-full border border-neutral-200 hover:border-neutral-300 bg-white flex items-center gap-2"
          >
            <Download className="h-3.5 w-3.5" /> {busy ? 'Preparing…' : 'Download data'}
          </motion.button>
        </div>
      </Card>

      {/* Calendar feed */}
      <Card>
        <SectionHead icon={Mail} title="Calendar feed" />
        <div className="px-5 py-4">
          <p className="text-[13px] text-neutral-600 mb-3">
            Subscribe to your calendar from Apple Calendar, Google Calendar, or Outlook.
          </p>
          <FeedUrl />
        </div>
      </Card>

      {/* Danger */}
      <Card danger>
        <SectionHead icon={AlertTriangle} title="Danger zone" tone="red" />
        <div className="px-5 py-4">
          {!showDelete ? (
            <>
              <p className="text-[13px] text-neutral-600 mb-3">
                Permanently delete your account and all associated data.
              </p>
              <button
                onClick={() => setShowDelete(true)}
                className="text-[13px] font-medium text-red-700 hover:text-red-800 px-4 py-2 rounded-full border border-red-200 hover:border-red-300 bg-white flex items-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete account
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] text-red-700 font-medium">
                This cannot be undone. Type <code className="px-1.5 py-0.5 bg-red-100 rounded text-red-900 font-mono text-[12px]">DELETE</code> to confirm.
              </p>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-2 rounded-lg border border-red-300 focus:outline-none focus:border-red-500 text-[14px]"
              />
              {error && <p className="text-[12px] text-red-700">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDelete(false); setConfirmText(''); setError('') }}
                  disabled={busy}
                  className="flex-1 px-4 py-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={busy || confirmText !== 'DELETE'}
                  className="flex-1 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-[13px] font-medium disabled:opacity-50"
                >
                  {busy ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function Card({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${danger ? 'border-red-200' : 'border-neutral-200'}`}>
      {children}
    </div>
  )
}

function SectionHead({ icon: Icon, title, tone }: { icon: any; title: string; tone?: string }) {
  const cls = tone === 'red' ? 'text-red-700' : 'text-neutral-700'
  return (
    <div className={`px-5 py-3 border-b ${tone === 'red' ? 'border-red-100 bg-red-50/30' : 'border-neutral-100'} flex items-center gap-2 ${cls}`}>
      <Icon className="h-4 w-4" />
      <h2 className="font-semibold text-[14px]">{title}</h2>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-neutral-500">{label}</span>
      <span className={`text-[13.5px] text-neutral-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}


function FeedUrl() {
  const [url, setUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const get = async () => {
    const r = await fetch('/api/ics/token')
    if (!r.ok) return
    const j = await r.json()
    const u = `${window.location.origin}${j.url}`
    setUrl(u)
  }
  const copy = async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  if (!url) return (
    <button onClick={get} className="text-[13px] font-medium text-neutral-700 hover:text-neutral-900 px-4 py-2 rounded-full border border-neutral-200 bg-white">
      Show feed URL
    </button>
  )
  return (
    <div className="space-y-2">
      <input readOnly value={url} className="w-full text-[12px] font-mono px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50" onFocus={e => e.currentTarget.select()} />
      <button onClick={copy} className="text-[12.5px] font-medium text-neutral-700 hover:text-neutral-900 px-3 py-1.5 rounded-full border border-neutral-200 bg-white">
        {copied ? 'Copied' : 'Copy URL'}
      </button>
    </div>
  )
}


function DefaultLocationField({ initial }: { initial: string }) {
  const [val, setVal] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const save = async () => { setBusy(true); await setDefaultLocation(val); if (typeof window !== 'undefined') localStorage.setItem('frpimen_default_location', val); setSaved(true); setBusy(false); setTimeout(() => setSaved(false), 1500) }
  return (
    <div className="flex items-center gap-2">
      <input value={val} onChange={e => setVal(e.target.value)}
             placeholder="205 S Church St, Prosper, TX 75078"
             className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-400 text-[14px]" />
      <button onClick={save} disabled={busy} className="text-[13px] font-medium text-neutral-700 hover:text-neutral-900 px-3 py-2 rounded-full border border-neutral-200 hover:border-neutral-300 bg-white flex items-center gap-1.5">
        <SaveIcon className="h-3.5 w-3.5" /> {busy ? 'Saving…' : saved ? 'Saved' : 'Save'}
      </button>
    </div>
  )
}
