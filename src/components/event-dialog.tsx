'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { DateTime } from 'luxon'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createEvent, updateEvent, deleteEvent } from '@/app/actions/events'
import { checkConflicts, suggestAlternatives, type ConflictEvent } from '@/app/actions/conflicts'
import { Trash2, AlertTriangle, Sparkles, MapPin, FileText, Repeat, Loader2, X, CalendarDays, Clock, Tag, Eye, Activity } from 'lucide-react'

const TZ = 'America/Chicago'

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
  rrule?: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  meetingTypes: MeetingType[]
  event?: EventData | null
  defaultDate?: Date | null
}

function buildTimeOptions(): string[] {
  const opts: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return opts
}
const TIME_OPTIONS = buildTimeOptions()

function formatTimeLabel(hm: string): string {
  const [h, m] = hm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function isoToParts(iso?: string): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const dt = DateTime.fromISO(iso, { zone: 'utc' }).setZone(TZ)
  return { date: dt.toFormat('yyyy-LL-dd'), time: dt.toFormat('HH:mm') }
}

function partsToISO(date: string, time: string): string {
  return DateTime.fromFormat(`${date} ${time}`, 'yyyy-LL-dd HH:mm', { zone: TZ }).toUTC().toISO() ?? ''
}

function prettyRange(startDate: string, startTime: string, endDate: string, endTime: string): string {
  if (!startDate || !startTime || !endDate || !endTime) return ''
  const s = DateTime.fromFormat(`${startDate} ${startTime}`, 'yyyy-LL-dd HH:mm', { zone: TZ })
  const e = DateTime.fromFormat(`${endDate} ${endTime}`, 'yyyy-LL-dd HH:mm', { zone: TZ })
  if (!s.isValid || !e.isValid) return ''
  const sameDay = s.hasSame(e, 'day')
  if (sameDay) {
    return `${s.toFormat('EEEE, LLL d')} · ${s.toFormat('h:mm a')} – ${e.toFormat('h:mm a')}`
  }
  return `${s.toFormat('EEE LLL d, h:mm a')} – ${e.toFormat('EEE LLL d, h:mm a')}`
}

export function EventDialog({ open, onOpenChange, meetingTypes, event, defaultDate }: Props) onst isEdit = !!event?.id
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [meetingTypeId, setMeetingTypeId] = useState('')
  const [busyLevel, setBusyLevel] = useState('busy')
  const [visibility, setVisibility] = useState('default')
  const [recurrence, setRecurrence] = useState('none')
  const [error, setError] = useState('')
  const [conflicts, setConflicts] = useState<ConflictEvent[]>([])
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [checkingConflicts, setCheckingConflicts] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [overrideConflict, setOverrideConflict] = useState(false)
  const endTouchedRef = useRef(false)

  useEffect(() => {
    if (!open) return
    if (event) {
      setTitle(event.title ?? '')
      setDescription(event.description ?? '')
      setLocation(event.location ?? '')
      const sp = isoToParts(event.starts_at)
      const ep = isoToParts(event.ends_at)
      setStartDate(sp.date); setStartTime(sp.time)
      setEndDate(ep.date); setEndTime(ep.time)
      setMeetingTypeId(event.meeting_type_id ?? meetingTypes[0]?.id ?? '')
      setBusyLevel(event.busy_level ?? 'busy')
      setVisibility(event.visibility ?? 'default')
      setRecurrence(rruleToPreset(event.rrule))
      endTouchedRef.current = true
    } else {
      const base = defaultDate ?? new Date()
      const isUtcMidnight = base.getUTCHours() === 0 && base.getUTCMinutes() === 0 && base.getUTCSeconds() === 0
      let startDt: DateTime
      if (isUtcMidnight) {
        startDt = DateTime.fromObject(
          { year: base.getUTCFullYear(), month: base.getUTCMonth() + 1, day: base.getUTCDate(), hour: 9, minute: 0 },
          { zone: TZ }
        )
      } else {
        const local = DateTime.fromJSDate(base).setZone(TZ)
        const roundedMin = Math.round(local.minute / 15) * 15
        startDt = local.set({ second: 0, millisecond: 0 }).plus({ minutes: roundedMin - local.minute })
      }
      const defaultType = meetingTypes[0]
      const durMin = defaultType?.default_duration_minutes ?? 60
      const endDt = startDt.plus({ minutes: durMin })
      setTitle(''); setDescription(''); setLocation('')
      setStartDate(startDt.toFormat('yyyy-LL-dd'))
      setStartTime(startDt.toFormat('HH:mm'))
      setEndDate(endDt.toFormat('yyyy-LL-dd'))
      setEndTime(endDt.toFormat('HH:mm'))
      setMeetingTypeId(defaultType?.id ?? '')
      setBusyLevel('busy'); setVisibility('default'); setRecurrence('none')
      endTouchedRef.current = false
    }
    setError(''); setConflicts([]); setAlternatives([]); setOverrideConflict(false)
  }, [open, event, defaultDate, meetingTypes])

  useEffect(() => {
    if (isEdit) return
    if (!startDate || !startTime) return
    const mt = meetingTypes.find(m => m.id === meetingTypeId)
    const durMin = mt?.default_duration_minutes ?? 60
    const sDt = DateTime.fromFormat(`${startDate} ${startTime}`, 'yyyy-LL-dd HH:mm', { zone: TZ })
    if (!sDt.isValid) return
    if (!endTouchedRef.current) {
      const e = sDt.plus({ minutes: durMin })
      setEndDate(e.toFormat('yyyy-LL-dd'))
      setEndTime(e.toFormat('HH:mm'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, startTime, meetingTypeId])

  useEffect(() => {
    if (!startDate || !startTime || !endDate || !endTime) return
    const t = setTimeout(async () => {
      setCheckingConflicts(true)
      const startsIso = partsToISO(startDate, startTime)
      const endsIso = partsToISO(endDate, endTime)
      if (!startsIso || !endsIso) { setCheckingConflicts(false); return }
      const list = await checkConflicts(startsIso, endsIso, event?.id)
      setConflicts(list); setAlternatives([]); setCheckingConflicts(false)
    }, 450)
    return () => clearTimeout(t)
  }, [startDate, startTime, endDate, endTime, event?.id])

  async function handleSuggestAlternatives() {
    setSuggesting(true); setAlternatives([])
    const alts = await suggestAlternatives(title || 'Meeting', partsToISO(startDate, startTime), partsToISO(endDate, endTime), conflicts)
    setAlternatives(alts); setSuggesting(false)
  }

  function applyAlternative(iso: string) {
    const startDt = DateTime.fromISO(iso).setZone(TZ)
    const durMin = DateTime.fromFormat(`${endDate} ${endTime}`, 'yyyy-LL-dd HH:mm', { zone: TZ })
      .diff(DateTime.fromFormat(`${startDate} ${startTime}`, 'yyyy-LL-dd HH:mm', { zone: TZ }), 'minutes').minutes
    const endDt = startDt.plus({ minutes: durMin })
    setStartDate(startDt.toFormat('yyyy-LL-dd'))
    setStartTime(startDt.toFormat('HH:mm'))
    setEndDate(endDt.toFormat('yyyy-LL-dd'))
    setEndTime(endDt.toFormat('HH:mm'))
    endTouchedRef.current = true
  }

  function onEndTimeChange(v: string) { endTouchedRef.current = true; setEndTime(v) }
  function onEndDateChange(v: string) { endTouchedRef.current = true; setEndDate(v) }

  async function handleSave() {
    setError('')
    if (!title.trim()) { setError('Title required'); return }
    if (!startDate || !startTime || !endDate || !endTime) { setError('Date and time required'); return }
    const sIso = partsToISO(startDate, startTime)
    const eIso = partsToISO(endDate, endTime)
    if (new Date(eIso) <= new Date(sIso)) { setError('End must be after start'); return }
    if (conflicts.length > 0 && !overrideConflict) { setError('Resolve conflicts or check "Book anyway"'); return }

    const fd = new FormData()
    fd.set('title', title); fd.set('description', description); fd.set('location', location)
    fd.set('starts_at', sIso); fd.set('ends_at', eIso); fd.set('all_day', 'false')
    fd.set('meeting_type_id', meetingTypeId); fd.set('busy_level', busyLevel)
    fd.set('visibility', visibility); fd.set('rrule', presetToRrule(recurrence, startDate, startTime) ?? '')

    startTransition(async () => {
      const res = isEdit ? await updateEvent(event!.id!, fd) : await createEvent(fd)
      if ((res as any)?.error) setError((res as any).error)
      else onOpenChange(false)
    })
  }

  async function handleDelete() {
    if (!event?.id) return
    if (!confirm('Delete this event?')) return
    startTransition(async () => { await deleteEvent(event.id!); onOpenChange(false) })
  }

  const currentType = meetingTypes.find(m => m.id === meetingTypeId)
  const rangeText = prettyRange(startDate, startTime, endDate, endTime)
  const accent = currentType?.color || '#6366f1'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 max-h-[92vh] overflow-y-auto [&>button]:hidden rounded-2xl">
        <div
          className="px-5 pt-5 pb-4 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.12)} 0%, ${hexToRgba(accent, 0.04)} 100%)` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: accent }} />
              <DialogTitle className="text-[15px] font-semibold text-neutral-900">{isEdit ? 'Edit event' : 'New event'}</DialogTitle>
            </div>
            <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/60 backdrop-blur transition">
              <X className="h-4 w-4 text-neutral-600" />
            </button>
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Add title"
            className="w-full text-xl font-semibold mt-3 placeholder:text-neutral-400 border-0 focus:outline-none bg-transparent text-neutral-900"
          />
        </div>

        <div className="px-5 py-5 space-y-5">
          <div className="rounded-xl border border-neutral-200 p-4 space-y-3 bg-neutral-50/40">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
              <CalendarDays className="h-3.5 w-3.5" /> Date and time
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-600 w-12 shrink-0">Starts</span>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 flex-1 bg-white" />
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="h-9 w-[110px] bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-600 w-12 shrink-0">Ends</span>
                <Input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} className="h-9 flex-1 bg-white" />
                <Select value={endTime} onValueChange={onEndTimeChange}>
                  <SelectTrigger className="h-9 w-[110px] bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {rangeText && <p className="text-xs text-neutral-500 pl-14">{rangeText}</p>}
          </div>

          {checkingConflicts && (
            <p className="text-xs text-neutral-500 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking conflicts...
            </p>
          )}

          {conflicts.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                <AlertTriangle className="h-4 w-4" /> Overlaps with {conflicts.length} event{conflicts.length > 1 ? 's' : ''}
              </div>
              <ul className="text-[13px] text-amber-900 space-y-1 pl-1">
                {conflicts.map(c => {
                  const s = DateTime.fromISO(c.starts_at, { zone: 'utc' }).setZone(TZ)
                  const en = DateTime.fromISO(c.ends_at, { zone: 'utc' }).setZone(TZ)
                  return (
                    <li key={c.id} className="flex gap-2">
                      <span className="text-amber-500">•</span>
                      <div>
                        <span className="font-medium">{c.title}</span> <span className="text-amber-700">{s.toFormat('h:mm a')} – {en.rmat('h:mm a')}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="button" size="sm" variant="outline" onClick={handleSuggestAlternatives} disabled={suggesting} className="bg-white">
                  {suggesting ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1.5" />} Suggest times
                </Button>
                <label className="flex items-center gap-2 text-xs text-amber-900 cursor-pointer pl-1">
                  <input type="checkbox" checked={overrideConflict} onChange={e => setOverrideConflict(e.target.checked)} /> Book anyway
                </label>
              </div>
              {alternatives.length > 0 && (
                <div className="pt-3 border-t border-amber-200/60 space-y-2">
                  <p className="text-[11px] text-amber-800 uppercase tracking-wider font-semibold">Pick one</p>
                  <div className="flex flex-wrap gap-1.5">
                    {alternatives.map((a, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyAlternative(a)}
                        className="px-3 py-1.5 rounded-full bg-white border border-amber-200 text-xs font-medium text-amber-900 hover:bg-amber-100 transition"
                      >
                        {DateTime.fromISO(a).setZone(TZ).toFormat('EEE LLL d, h:mm a')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
              <MapPin className="h-3.5 w-3.5" /> Location
            </div>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Office, Zoom, church..." className="h-10" />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
              <FileText className="h-3.5 w-3.5" /> Notes
            </div>
            <Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                <Tag className="h-3 w-3" /> Type
              </div>
              <Select value={meetingTypeId} onValueChange={setMeetingTypeId}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  {meetingTypes.map(mt => (
                    <SelectItem key={mt.id} value={mt.id}>
                      <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: mt.color }} />{mt.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                <Activity className="h-3 w-3" /> Status
              </div>
              <Select value={busyLevel} onValueChange={setBusyLevel}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                <Repeat className="h-3 w-3" /> Repeats
              </div>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekdays">Every weekday</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                  <SelectItem value="monthly_date">Monthly</SelectItem>
                  <SelectItem value="monthly_weekday">Monthly (weekday)</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                <Eye className="h-3 w-3" /> Visibility
              </div>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100 bg-neutral-50/60 backdrop-blur sticky bottom-0">
          {isEdit ? (
            <Button type="button" variant="ghost" onClick={handleDelete} disabled={pending} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 rounded-full">
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending} className="h-9 rounded-full">Cancel</Button>
            <Button type="button" onClick={handleSave} disabled={pending} className="h-9 rounded-full px-5" style={{ background: accent }}>
              {pending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving</> : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function presetToRrule(preset: string, startDate: string, startTime: string): string | null {
  if (preset === 'none') return null
  const d = DateTime.fromFormat(`${startDate} ${startTime}`, 'yyyy-LL-dd HH:mm', { zone: TZ })
  const wd = d.isValid ? ['SU','MO','TU','WE','TH','FR','SA'][d.weekday % 7] : 'MO'
  const dayOfMonth = d.isValid ? d.day : 1
  const weekNum = d.isValid ? Math.ceil(d.day / 7) : 1
  switch (preset) {
    case 'daily': return 'FREQ=DAILY'
    case 'weekdays': return 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
    case 'weekly': return `FREQ=WEEKLY;BYDAY=${wd}`
    case 'biweekly': return `FREQ=WEEKLY;INTERVAL=2;BYDAY=${wd}`
    case 'monthly_date': return `FREQ=MONTHLY;BYMONTHDAY=${dayOfMonth}`
    case 'monthly_weekday': return `FREQ=MONTHLY;BYDAY=${weekNum}${wd}`
    case 'yearly': return 'FREQ=YEARLY'
    default: return null
  }
}

function rruleToPreset(rrule?: string | null): string {
  if (!rrule) return 'none'
  const r = rrule.toUpperCase()
  if (r === 'FREQ=DAILY') return 'daily'
  if (r.includes('FREQ=WEEKLY') && r.includes('MO,TU,WE,TH,FR')) return 'weekdays'
  if (r.includes('FREQ=WEEKLY') && r.includes('INTERVAL=2')) return 'biweekly'
  if (r.includes('FREQ=WEEKLY')) return 'weekly'
  if (r.includes('FREQ=MONTHLY') && r.includes('BYMONTHDAY')) return 'monthly_date'
  if (r.includes('FREQ=MONTHLY')) return 'monthly_weekday'
  if (r === 'FREQ=YEARLY') return 'yearly'
  return 'none'
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(n.substring(0, 2), 16)
  const g = parseInt(n.substring(2, 4), 16)
  const b = parseInt(n.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
