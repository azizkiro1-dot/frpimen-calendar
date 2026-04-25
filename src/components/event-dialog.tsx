'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { DateTime } from 'luxon'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createEvent, updateEvent, deleteEvent } from '@/app/actions/events'
import { checkConflicts, suggestAlternatives, type ConflictEvent } from '@/app/actions/conflicts'
import { Trash2, AlertTriangle, Sparkles, Loader2 } from 'lucide-react'

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
  const o: string[] = []
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) {
    o.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return o
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

function prettyRange(sd: string, st: string, ed: string, et: string): string {
  if (!sd || !st || !ed || !et) return ''
  const s = DateTime.fromFormat(`${sd} ${st}`, 'yyyy-LL-dd HH:mm', { zone: TZ })
  const e = DateTime.fromFormat(`${ed} ${et}`, 'yyyy-LL-dd HH:mm', { zone: TZ })
  if (!s.isValid || !e.isValid) return ''
  const sameDay = s.hasSame(e, 'day')
  if (sameDay) return `${s.toFormat('EEEE, LLL d')} · ${s.toFormat('h:mm a')} – ${e.toFormat('h:mm a')}`
  return `${s.toFormat('EEE LLL d, h:mm a')} – ${e.toFormat('EEE LLL d, h:mm a')}`
}

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setM(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return m
}

export function EventDialog({ open, onOpenChange, meetingTypes, event, defaultDate }: Props) {
  const isEdit = !!event?.id
  const isMobile = useIsMobile()
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
  const [attendeeEmails, setAttendeeEmails] = useState<string[]>([])
  const [attendeeInput, setAttendeeInput] = useState('')
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
      setAttendeeEmails([])
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
      setAttendeeEmails([])
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
      const sIso = partsToISO(startDate, startTime)
      const eIso = partsToISO(endDate, endTime)
      if (!sIso || !eIso) { setCheckingConflicts(false); return }
      const list = await checkConflicts(sIso, eIso, event?.id)
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
    fd.set('attendee_emails', attendeeEmails.join(','))
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

  const rangeText = prettyRange(startDate, startTime, endDate, endTime)
  const currentTypeColor = meetingTypes.find(m => m.id === meetingTypeId)?.color ?? '#6366f1'

  const Body = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 h-12 border-b border-neutral-100 bg-white shrink-0">
        <button onClick={() => onOpenChange(false)} className="text-sm text-neutral-600 hover:text-neutral-900">Cancel</button>
        <div className="text-[15px] font-semibold text-neutral-900">{isEdit ? 'Edit event' : 'New event'}</div>
        <button onClick={handleSave} disabled={pending} className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50">
          {pending ? '...' : isEdit ? 'Save' : 'Add'}
        </button>
      </div>

      <div className="bg-white overflow-y-auto flex-1">
        <div className="px-5 py-3 border-b border-neutral-100 flex items-start gap-3">
          <span className="h-3 w-3 rounded-full mt-2.5 shrink-0" style={{ background: currentTypeColor }} />
          <div className="flex-1">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full text-[17px] font-medium placeholder:text-neutral-400 border-0 focus:outline-none bg-transparent text-neutral-900"
            />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Location"
              className="w-full mt-1 text-[14px] placeholder:text-neutral-400 border-0 focus:outline-none bg-transparent text-neutral-700"
            />
          </div>
        </div>

        <div className="px-5 py-3 border-b border-neutral-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-neutral-700">Starts</span>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-[14px] text-neutral-900 bg-transparent border-0 focus:outline-none tabular-nums" />
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="h-7 w-[100px] text-[13px] bg-neutral-100 border-0 rounded-md px-2.5 hover:bg-neutral-200"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-neutral-700">Ends</span>
            <div className="flex items-center gap-2">
              <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} className="text-[14px] text-neutral-900 bg-transparent border-0 focus:outline-none tabular-nums" />
              <Select value={endTime} onValueChange={onEndTimeChange}>
                <SelectTrigger className="h-7 w-[100px] text-[13px] bg-neutral-100 border-0 rounded-md px-2.5 hover:bg-neutral-200"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {rangeText && <p className="text-[12px] text-neutral-500">{rangeText}</p>}
          {checkingConflicts && <p className="text-[12px] text-neutral-500 flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Checking...</p>}
        </div>

        {conflicts.length > 0 && (
          <div className="px-5 py-3 border-b border-neutral-100 bg-amber-50/60">
            <div className="flex items-center gap-2 text-amber-900 font-medium text-[13px] mb-2">
              <AlertTriangle className="h-3.5 w-3.5" /> Overlaps with {conflicts.length} event{conflicts.length > 1 ? 's' : ''}
            </div>
            <ul className="text-[12px] text-amber-900 space-y-0.5 mb-2">
              {conflicts.map(c => {
                const s = DateTime.fromISO(c.starts_at, { zone: 'utc' }).setZone(TZ)
                const en = DateTime.fromISO(c.ends_at, { zone: 'utc' }).setZone(TZ)
                return <li key={c.id}>• <span className="font-medium">{c.title}</span> {s.toFormat('h:mm a')} – {en.toFormat('h:mm a')}</li>
              })}
            </ul>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleSuggestAlternatives} disabled={suggesting} className="text-[12px] font-medium text-amber-900 hover:text-amber-950 flex items-center gap-1">
                {suggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Suggest times
              </button>
              <label className="flex items-center gap-1.5 text-[12px] text-amber-900 cursor-pointer">
                <input type="checkbox" checked={overrideConflict} onChange={e => setOverrideConflict(e.target.checked)} /> Book anyway
              </label>
            </div>
            {alternatives.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {alternatives.map((a, i) => (
                  <button key={i} type="button" onClick={() => applyAlternative(a)} className="px-2.5 py-1 rounded-md bg-white border border-amber-200 text-[11.5px] font-medium text-amber-900 hover:bg-amber-100">
                    {DateTime.fromISO(a).setZone(TZ).toFormat('EEE LLL d, h:mm a')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Row label="Type">
          <Select value={meetingTypeId} onValueChange={setMeetingTypeId}>
            <SelectTrigger className="h-7 min-w-[140px] text-[13px] bg-neutral-100 border-0 rounded-md px-2.5 hover:bg-neutral-200">
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              {meetingTypes.map(mt => (
                <SelectItem key={mt.id} value={mt.id}>
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: mt.color }} />{mt.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>

        <Row label="Status">
          <Select value={busyLevel} onValueChange={setBusyLevel}>
            <SelectTrigger className="h-7 min-w-[140px] text-[13px] bg-neutral-100 border-0 rounded-md px-2.5 hover:bg-neutral-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="tentative">Tentative</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="out_of_office">Out of office</SelectItem>
              <SelectItem value="confidential">Confidential</SelectItem>
            </SelectContent>
          </Select>
        </Row>

        <Row label="Repeat">
          <Select value={recurrence} onValueChange={setRecurrence}>
            <SelectTrigger className="h-7 min-w-[140px] text-[13px] bg-neutral-100 border-0 rounded-md px-2.5 hover:bg-neutral-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Never</SelectItem>
              <SelectItem value="daily">Every day</SelectItem>
              <SelectItem value="weekdays">Every weekday</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Every 2 weeks</SelectItem>
              <SelectItem value="monthly_date">Monthly</SelectItem>
              <SelectItem value="monthly_weekday">Monthly (same weekday)</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </Row>

        <Row label="People">
          <div className="flex-1 ml-3 flex flex-wrap items-center gap-1.5 max-w-[220px]">
            {attendeeEmails.map((em, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11.5px] text-blue-800">
                {em}
                <button type="button" onClick={() => setAttendeeEmails(attendeeEmails.filter((_, j) => j !== i))} className="text-blue-500 hover:text-blue-700">×</button>
              </span>
            ))}
            <input
              type="email"
              value={attendeeInput}
              onChange={e => setAttendeeInput(e.target.value)}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ',') && attendeeInput.includes('@')) {
                  e.preventDefault()
                  if (!attendeeEmails.includes(attendeeInput.trim())) setAttendeeEmails([...attendeeEmails, attendeeInput.trim()])
                  setAttendeeInput('')
                }
                if (e.key === 'Backspace' && !attendeeInput && attendeeEmails.length) {
                  setAttendeeEmails(attendeeEmails.slice(0, -1))
                }
              }}
              placeholder={attendeeEmails.length ? '' : 'email@example.com'}
              className="flex-1 min-w-[100px] text-[13px] bg-transparent border-0 outline-none placeholder:text-neutral-400"
            />
          </div>
        </Row>

        <Row label="Visibility">
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger className="h-7 min-w-[140px] text-[13px] bg-neutral-100 border-0 rounded-md px-2.5 hover:bg-neutral-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="confidential">Confidential</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </Row>

        <div className="px-5 py-3 border-b border-neutral-100">
          <Textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Notes"
            className="resize-none border-0 px-0 py-0 focus:ring-0 focus-visible:ring-0 shadow-none text-[14px] placeholder:text-neutral-400"
          />
        </div>

        {error && <div className="px-5 py-2 bg-red-50 border-b border-red-100 text-[13px] text-red-700">{error}</div>}

        {isEdit && (
          <div className="px-5 py-3 pb-6">
            <button type="button" onClick={handleDelete} disabled={pending} className="text-[14px] text-red-600 hover:text-red-700 flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Delete event
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[88vh] p-0 rounded-t-3xl bg-white border-0 [&>button]:hidden overflow-hidden"
        >
          <SheetTitle className="sr-only">{isEdit ? 'Edit event' : 'New event'}</SheetTitle>
          <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-neutral-300" />
          {Body}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 max-h-[92vh] overflow-hidden [&>button]:hidden rounded-2xl bg-white border border-neutral-200 shadow-xl">
        <DialogTitle className="sr-only">{isEdit ? 'Edit event' : 'New event'}</DialogTitle>
        {Body}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-2.5 border-b border-neutral-100 flex items-center justify-between">
      <span className="text-[14px] text-neutral-700">{label}</span>
      {children}
    </div>
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
