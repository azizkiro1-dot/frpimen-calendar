'use client'

import { useState, useTransition, useEffect } from 'react'
import { DateTime } from 'luxon'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createEvent, updateEvent, deleteEvent } from '@/app/actions/events'
import { checkConflicts, suggestAlternatives, type ConflictEvent } from '@/app/actions/conflicts'
import { Trash2, AlertTriangle, Sparkles, Clock, MapPin, FileText, Tag, Eye, Loader2 } from 'lucide-react'

const TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'America/Chicago'

export type MeetingType = {
  id: string
  name: string
  color: string
  category: string
  default_duration_minutes: number
}

export type EventData = {
  id?: string
  title?: string
  description?: string
  location?: string
  starts_at?: string
  ends_at?: string
  all_day?: boolean
  meeting_type_id?: string | null
  busy_level?: string
  visibility?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  meetingTypes: MeetingType[]
  event?: EventData | null
  defaultDate?: Date | null
}

function isoToLocalInput(iso?: string): string {
  if (!iso) return ''
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone(TZ).toFormat("yyyy-LL-dd'T'HH:mm")
}

function localInputToISO(local: string): string {
  return DateTime.fromFormat(local, "yyyy-LL-dd'T'HH:mm", { zone: TZ }).toUTC().toISO() ?? ''
}

function dateToLocalInput(d: Date): string {
  return DateTime.fromJSDate(d).setZone(TZ).toFormat("yyyy-LL-dd'T'HH:mm")
}

function prettyRange(startIso: string, endIso: string): string {
  const s = DateTime.fromISO(startIso, { zone: 'utc' }).setZone(TZ)
  const e = DateTime.fromISO(endIso, { zone: 'utc' }).setZone(TZ)
  return `${s.toFormat('EEE LLL d, h:mm a')} – ${e.toFormat('h:mm a')}`
}

export function EventDialog({ open, onOpenChange, meetingTypes, event, defaultDate }: Props) {
  const isEdit = !!event?.id
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [starts, setStarts] = useState('')
  const [ends, setEnds] = useState('')
  const [meetingTypeId, setMeetingTypeId] = useState('')
  const [busyLevel, setBusyLevel] = useState('busy')
  const [visibility, setVisibility] = useState('default')
  const [error, setError] = useState('')
  const [conflicts, setConflicts] = useState<ConflictEvent[]>([])
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [checkingConflicts, setCheckingConflicts] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [overrideConflict, setOverrideConflict] = useState(false)

  useEffect(() => {
    if (!open) return
    if (event) {
      setTitle(event.title ?? '')
      setDescription(event.description ?? '')
      setLocation(event.location ?? '')
      setStarts(isoToLocalInput(event.starts_at))
      setEnds(isoToLocalInput(event.ends_at))
      setMeetingTypeId(event.meeting_type_id ?? meetingTypes[0]?.id ?? '')
      setBusyLevel(event.busy_level ?? 'busy')
      setVisibility(event.visibility ?? 'default')
    } else {
      const base = defaultDate ?? new Date()
      const dtStart = DateTime.fromJSDate(base).setZone(TZ)
      // If time is midnight (day-click), default to 9am
      const adjusted = dtStart.hour === 0 && dtStart.minute === 0
        ? dtStart.set({ hour: 9, minute: 0 })
        : dtStart.set({ second: 0, millisecond: 0 })
      const dtEnd = adjusted.plus({ hours: 1 })
      setTitle('')
      setDescription('')
      setLocation('')
      setStarts(adjusted.toFormat("yyyy-LL-dd'T'HH:mm"))
      setEnds(dtEnd.toFormat("yyyy-LL-dd'T'HH:mm"))
      setMeetingTypeId(meetingTypes[0]?.id ?? '')
      setBusyLevel('busy')
      setVisibility('default')
    }
    setError('')
    setConflicts([])
    setAlternatives([])
    setOverrideConflict(false)
  }, [open, event, defaultDate, meetingTypes])

  // When meeting type changes on new events, auto-adjust end time
  useEffect(() => {
    if (isEdit || !starts || !meetingTypeId) return
    const mt = meetingTypes.find(m => m.id === meetingTypeId)
    if (!mt) return
    const s = DateTime.fromFormat(starts, "yyyy-LL-dd'T'HH:mm", { zone: TZ })
    if (!s.isValid) return
    const newEnd = s.plus({ minutes: mt.default_duration_minutes })
    setEnds(newEnd.toFormat("yyyy-LL-dd'T'HH:mm"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingTypeId])

  useEffect(() => {
    if (!starts || !ends) return
    const t = setTimeout(async () => {
      setCheckingConflicts(true)
      const list = await checkConflicts(localInputToISO(starts), localInputToISO(ends), event?.id)
      setConflicts(list)
      setAlternatives([])
      setCheckingConflicts(false)
    }, 500)
    return () => clearTimeout(t)
  }, [starts, ends, event?.id])

  async function handleSuggestAlternatives() {
    setSuggesting(true)
    setAlternatives([])
    const alts = await suggestAlternatives(title || 'Meeting', localInputToISO(starts), localInputToISO(ends), conflicts)
    setAlternatives(alts)
    setSuggesting(false)
  }

  function applyAlternative(iso: string) {
    const startDt = DateTime.fromISO(iso).setZone(TZ)
    const durationMin = DateTime.fromFormat(ends, "yyyy-LL-dd'T'HH:mm", { zone: TZ })
      .diff(DateTime.fromFormat(starts, "yyyy-LL-dd'T'HH:mm", { zone: TZ }), 'minutes').minutes
    const endDt = startDt.plus({ minutes: durationMin })
    setStarts(startDt.toFormat("yyyy-LL-dd'T'HH:mm"))
    setEnds(endDt.toFormat("yyyy-LL-dd'T'HH:mm"))
  }

  async function handleSave() {
    setError('')
    if (!title.trim()) { setError('Title required'); return }
    if (!starts || !ends) { setError('Times required'); return }
    if (DateTime.fromFormat(ends, "yyyy-LL-dd'T'HH:mm") <= DateTime.fromFormat(starts, "yyyy-LL-dd'T'HH:mm")) {
      setError('End must be after start'); return
    }
    if (conflicts.length > 0 && !overrideConflict) {
      setError('Resolve conflicts or check "Book anyway"')
      return
    }

    const fd = new FormData()
    fd.set('title', title)
    fd.set('description', description)
    fd.set('location', location)
    fd.set('starts_at', localInputToISO(starts))
    fd.set('ends_at', localInputToISO(ends))
    fd.set('all_day', 'false')
    fd.set('meeting_type_id', meetingTypeId)
    fd.set('busy_level', busyLevel)
    fd.set('visibility', visibility)

    startTransition(async () => {
      const res = isEdit
        ? await updateEvent(event!.id!, fd)
        : await createEvent(fd)
      if ((res as any)?.error) setError((res as any).error)
      else onOpenChange(false)
    })
  }

  async function handleDelete() {
    if (!event?.id) return
    if (!confirm('Delete this event?')) return
    startTransition(async () => {
      await deleteEvent(event.id!)
      onOpenChange(false)
    })
  }

  const currentType = meetingTypes.find(m => m.id === meetingTypeId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2 mb-1">
            {currentType && <span className="h-2.5 w-2.5 rounded-full" style={{ background: currentType.color }} />}
            <DialogTitle className="text-lg">{isEdit ? 'Edit event' : 'New event'}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">Times shown in {TZ}</DialogDescription>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Add title"
              className="text-base font-medium border-0 border-b rounded-none focus-visible:ring-0 focus-visible:border-slate-900 px-0"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-xs uppercase tracking-wide text-slate-500">When</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="datetime-local" value={starts} onChange={e => setStarts(e.target.value)} />
              <Input type="datetime-local" value={ends} onChange={e => setEnds(e.target.value)} />
            </div>
            {starts && ends && (
              <p className="text-xs text-slate-500">
                {prettyRange(localInputToISO(starts), localInputToISO(ends))}
              </p>
            )}
          </div>

          {checkingConflicts && (
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking conflicts...
            </p>
          )}

          {conflicts.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-medium text-sm">
                <AlertTriangle className="h-4 w-4" />
                Overlaps with {conflicts.length} event{conflicts.length > 1 ? 's' : ''}
              </div>
              <ul className="text-sm text-amber-900 space-y-1 pl-6 list-disc">
                {conflicts.map(c => (
                  <li key={c.id}>
                    <span className="font-medium">{c.title}</span>{' '}
                    <span className="text-amber-700">{prettyRange(c.starts_at, c.ends_at)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" size="sm" variant="outline" onClick={handleSuggestAlternatives} disabled={suggesting}>
                  {suggesting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  Suggest times
                </Button>
                <label className="flex items-center gap-2 text-xs text-amber-900 cursor-pointer">
                  <input type="checkbox" checked={overrideConflict} onChange={e => setOverrideConflict(e.target.checked)} />
                  Book anyway
                </label>
              </div>
              {alternatives.length > 0 && (
                <div className="pt-2 border-t border-amber-200">
                  <p className="text-xs text-amber-800 mb-2">Pick one:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {alternatives.map((a, i) => (
                      <Button key={i} type="button" size="sm" variant="secondary" onClick={() => applyAlternative(a)}>
                        {DateTime.fromISO(a).setZone(TZ).toFormat('EEE LLL d, h:mm a')}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> Location
            </div>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Office, Zoom, church..." />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <FileText className="h-3.5 w-3.5" /> Notes
            </div>
            <Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Type
              </Label>
              <Select value={meetingTypeId} onValueChange={setMeetingTypeId}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  {meetingTypes.map(mt => (
                    <SelectItem key={mt.id} value={mt.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: mt.color }} />
                        {mt.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-500">Status</Label>
              <Select value={busyLevel} onValueChange={setBusyLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="tentative">Tentative</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="out_of_office">Out of office</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Visibility
            </Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (follow sharing)</SelectItem>
                <SelectItem value="private">Private (only me)</SelectItem>
                <SelectItem value="confidential">Confidential (title hidden)</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50 gap-2">
          {isEdit && (
            <Button type="button" variant="ghost" onClick={handleDelete} disabled={pending} className="text-red-600 hover:text-red-700 hover:bg-red-50 mr-auto">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={pending}>
            {pending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving</> : 'Save event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
