'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { addShare, revokeShare, restoreShare, deleteShare } from '@/app/actions/sharing'
import { UserPlus, Trash2, RotateCcw, Eye, EyeOff, Users } from 'lucide-react'

type Share = {
  id: string
  shared_with_email: string
  access_level: string
  can_see_confidential: boolean
  revoked_at: string | null
  created_at: string
}

const accessLabels: Record<string, { label: string; desc: string }> = {
  see_busy: { label: 'Busy only', desc: 'Shows just time blocks without titles' },
  see_titles: { label: 'Titles', desc: 'Shows event titles and times' },
  see_details: { label: 'Full details', desc: 'Shows all event info except private' },
  edit: { label: 'Can edit', desc: 'Full access including creating events' },
}

export function SharingManager({ shares }: { shares: Share[] }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const active = shares.filter((s) => !s.revoked_at)
  const revoked = shares.filter((s) => s.revoked_at)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addShare(fd)
      if (res?.error) setError(res.error)
      else {
        setSuccess('Access granted')
        ;(e.target as HTMLFormElement).reset()
        setTimeout(() => setSuccess(null), 3000)
      }
    })
  }

  const handleRevoke = (id: string) => {
    if (!confirm('Revoke access for this person?')) return
    startTransition(() => { revokeShare(id) })
  }

  const handleRestore = (id: string) => {
    startTransition(() => { restoreShare(id) })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Permanently delete this share?')) return
    startTransition(() => { deleteShare(id) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar sharing</h1>
        <p className="text-sm text-slate-600 mt-1">
          Grant or revoke access to your calendar. Each person needs a Gmail address.
        </p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Grant access
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Gmail address *</Label>
              <Input id="email" name="email" type="email" required placeholder="person@gmail.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_level">Access level</Label>
              <Select name="access_level" defaultValue="see_busy">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(accessLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <div>
                        <div className="font-medium">{v.label}</div>
                        <div className="text-xs text-slate-500">{v.desc}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="can_see_confidential" name="can_see_confidential" type="checkbox" className="h-4 w-4 rounded" />
            <Label htmlFor="can_see_confidential" className="cursor-pointer">
              Can see confidential events
            </Label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Grant access'}
          </Button>
        </form>
      </div>

      <div>
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" /> Active shares ({active.length})
        </h2>
        {active.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-sm text-slate-500 text-center">
            No one has access yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border divide-y">
            {active.map((s) => (
              <div key={s.id} className="p-4 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{s.shared_with_email}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary">{accessLabels[s.access_level]?.label ?? s.access_level}</Badge>
                    {s.can_see_confidential ? (
                      <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                        <Eye className="h-3 w-3 mr-1" /> Confidential visible
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <EyeOff className="h-3 w-3 mr-1" /> Confidential hidden
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRevoke(s.id)} disabled={isPending}>
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {revoked.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2 text-slate-600">Revoked ({revoked.length})</h2>
          <div className="bg-white rounded-xl border divide-y">
            {revoked.map((s) => (
              <div key={s.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 text-slate-500">
                  <div>{s.shared_with_email}</div>
                  <div className="text-xs">Revoked {new Date(s.revoked_at!).toLocaleDateString()}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRestore(s.id)} disabled={isPending}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Restore
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} disabled={isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}