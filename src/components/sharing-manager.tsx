'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addShare, revokeShare, restoreShare, deleteShare } from '@/app/actions/sharing'
import { UserPlus, Trash2, RotateCcw, Eye, EyeOff, Users, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'

type Share = {
  id: string
  shared_with_email: string
  access_level: string
  can_see_confidential: boolean
  revoked_at: string | null
  created_at: string
}

const accessMeta: Record<string, { label: string; desc: string; tone: string; bg: string; ring: string }> = {
  see_busy: { label: 'Busy only', desc: 'Time blocks, no titles', tone: '#737373', bg: '#fafafa', ring: '#e5e5e5' },
  see_titles: { label: 'Titles', desc: 'Event titles + times', tone: '#2563eb', bg: '#eff6ff', ring: '#bfdbfe' },
  see_details: { label: 'Full details', desc: 'Everything except private', tone: '#9333ea', bg: '#f5f3ff', ring: '#ddd6fe' },
  edit: { label: 'Can edit', desc: 'Full access, can create events', tone: '#16a34a', bg: '#f0fdf4', ring: '#bbf7d0' },
}

function avatarColor(email: string): string {
  const palette = ['#f472b6', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#c084fc']
  let h = 0
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}
function initials(email: string): string {
  const local = email.split('@')[0]
  const parts = local.split(/[._-]/)
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

export function SharingManager({ shares }: { shares: Share[] }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const active = shares.filter(s => !s.revoked_at)
  const revoked = shares.filter(s => s.revoked_at)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null); setSuccess(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      const res = await addShare(fd)
      if ((res as any)?.error) setError((res as any).error)
      else {
        setSuccess('Access granted')
        form.reset()
        setTimeout(() => setSuccess(null), 3000)
      }
    })
  }
  const handleRevoke = (id: string) => {
    if (!confirm('Revoke access for this person?')) return
    startTransition(() => { revokeShare(id) })
  }
  const handleRestore = (id: string) => startTransition(() => { restoreShare(id) })
  const handleDelete = (id: string) => {
    if (!confirm('Permanently delete this share?')) return
    startTransition(() => { deleteShare(id) })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden border border-neutral-200" style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 50%, #dbeafe 100%)' }}>
        <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-800 font-semibold">Sharing</p>
            <h1 className="text-3xl font-bold text-neutral-900 mt-1">{active.length} active</h1>
            <p className="text-sm text-neutral-700 mt-1">
              People with access to your calendar
            </p>
          </div>
          <div className="flex items-center gap-1 -space-x-2">
            {active.slice(0, 5).map(s => (
              <div
                key={s.id}
                className="h-9 w-9 rounded-full ring-2 ring-white flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                style={{ background: avatarColor(s.shared_with_email) }}
                title={s.shared_with_email}
              >
                {initials(s.shared_with_email)}
              </div>
            ))}
            {active.length > 5 && (
              <div className="h-9 w-9 rounded-full ring-2 ring-white bg-white/80 flex items-center justify-center text-xs font-semibold text-neutral-700">
                +{active.length - 5}
              </div>
            )}
          </div>
        </div>
        <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }} />
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-[15px]">
          <UserPlus className="h-4 w-4" /> Grant access
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs uppercase tracking-wide text-neutral-500">Gmail address</Label>
              <Input id="email" name="email" type="email" required placeholder="person@gmail.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="access_level" className="text-xs uppercase tracking-wide text-neutral-500">Access level</Label>
              <Select name="access_level" defaultValue="see_busy">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(accessMeta).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: v.tone }} />
                        <div>
                          <div className="font-medium text-[13px]">{v.label}</div>
                          <div className="text-[11px] text-neutral-500">{v.desc}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input id="can_see_confidential" name="can_see_confidential" type="checkbox" className="h-4 w-4 rounded" />
            <span className="text-neutral-700">Allow viewing confidential events</span>
          </label>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {success}
            </div>
          )}
          <Button type="submit" disabled={isPending} className="rounded-full px-5">
            {isPending ? 'Saving...' : 'Grant access'}
          </Button>
        </form>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-3 px-1 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" /> Active ({active.length})
        </h2>
        {active.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-600">No one has access yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {active.map(s => {
              const meta = accessMeta[s.access_level] ?? accessMeta.see_busy
              return (
                <div key={s.id} className="bg-white rounded-xl border border-neutral-200 p-3.5 flex items-center gap-3 hover:border-neutral-300 transition">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-sm"
                    style={{ background: avatarColor(s.shared_with_email) }}
                  >
                    {initials(s.shared_with_email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-900 truncate text-sm">{s.shared_with_email}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                        style={{ color: meta.tone, background: meta.bg, border: `1px solid ${meta.ring}` }}
                      >
                        {meta.label}
                      </span>
                      {s.can_see_confidential ? (
                        <span className="text-[11px] text-purple-700 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Confidential visible
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                          <EyeOff className="h-3 w-3" /> Confidential hidden
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(s.id)}
                    disabled={isPending}
                    className="text-[12.5px] font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-full hover:bg-red-50"
                  >
                    Revoke
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {revoked.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-3 px-1">
            Revoked ({revoked.length})
          </h2>
          <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
            {revoked.map(s => (
              <div key={s.id} className="p-3.5 flex items-center gap-3 text-neutral-500">
                <div className="h-9 w-9 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-500 shrink-0">
                  {initials(s.shared_with_email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{s.shared_with_email}</div>
                  <div className="text-[11px]">Revoked {new Date(s.revoked_at!).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => handleRestore(s.id)}
                  disabled={isPending}
                  className="text-[12.5px] font-medium text-neutral-700 hover:text-neutral-900 px-3 py-1.5 rounded-full hover:bg-neutral-100 flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Restore
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={isPending}
                  className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
