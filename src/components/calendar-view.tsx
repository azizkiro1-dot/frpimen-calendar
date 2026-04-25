'use client'

import { useRef, useState, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import rrulePlugin from '@fullcalendar/rrule'
import luxon3Plugin from '@fullcalendar/luxon3'
import { Button } from '@/components/ui/button'
import { DateTime } from 'luxon'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'

const TZ = 'America/Chicago'

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  extendedProps?: {
    busy_level?: string
    visibility?: string
    meeting_type?: string
    location?: string
    description?: string
  }
}

type Props = {
  events: CalendarEvent[]
  onEventClick?: (id: string) => void
  onDateClick?: (date: Date) => void
  onCreateClick?: () => void
}

const VIEWS = [
  { id: 'dayGridMonth', label: 'Month' },
  { id: 'timeGridWeek', label: 'Week' },
  { id: 'timeGridDay', label: 'Day' },
  { id: 'listWeek', label: 'Agenda' },
] as const

type ViewId = typeof VIEWS[number]['id']

export function CalendarView({ events, onEventClick, onDateClick, onCreateClick }: Props) {
  const calendarRef = useRef<FullCalendar | null>(null)
  const [currentView, setCurrentView] = useState<ViewId>('dayGridMonth')
  const [title, setTitle] = useState('')

  const goPrev = () => calendarRef.current?.getApi().prev()
  const goNext = () => calendarRef.current?.getApi().next()
  const goToday = () => calendarRef.current?.getApi().today()
  const changeView = (view: ViewId) => {
    calendarRef.current?.getApi().changeView(view)
    setCurrentView(view)
  }

  const todayCount = useMemo(() => {
    const todayStr = DateTime.now().setZone(TZ).toFormat('yyyy-LL-dd')
    return events.filter(e => {
      const d = DateTime.fromISO(e.start, { setZone: true }).setZone(TZ).toFormat('yyyy-LL-dd')
      return d === todayStr
    }).length
  }, [events])

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={goToday} className="rounded-full h-8 px-4">Today</Button>
          <div className="flex items-center bg-neutral-50 rounded-full">
            <button onClick={goPrev} aria-label="Previous" className="h-8 w-8 rounded-full hover:bg-neutral-200/70 flex items-center justify-center transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={goNext} aria-label="Next" className="h-8 w-8 rounded-full hover:bg-neutral-200/70 flex items-center justify-center transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg sm:text-2xl font-semibold tracking-tight truncate">{title}</h2>
            {todayCount > 0 && currentView === 'dayGridMonth' && (
              <span className="text-xs text-neutral-500 hidden sm:inline">{todayCount} today</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-neutral-100 p-1">
            {VIEWS.map(v => (
              <button
                key={v.id}
                onClick={() => changeView(v.id)}
                className={`px-3 sm:px-4 py-1 text-xs sm:text-[13px] rounded-full transition font-medium ${
                  currentView === v.id
                    ? 'bg-white shadow-sm text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={onCreateClick} className="rounded-full shrink-0 h-8 px-4 shadow-sm">
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>
      </div>

      <div className="p-2 sm:p-5">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, rrulePlugin, luxon3Plugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          events={events}
          height="auto"
          nowIndicator
          dayMaxEvents={3}
          moreLinkClick="popover"
          dayPopoverFormat={{ month: 'long', day: 'numeric', year: 'numeric' }}
          editable
          selectable
          timeZone={TZ}
          eventDisplay="block"
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          slotLabelFormat={{ hour: 'numeric', meridiem: 'short' }}
          allDaySlot
          allDayText="all day"
          expandRows
          firstDay={0}
          dayHeaderFormat={
            currentView === 'dayGridMonth'
              ? { weekday: 'short' }
              : { weekday: 'short', day: 'numeric' }
          }
          datesSet={(arg) => setTitle(arg.view.title)}
          eventClick={(info) => onEventClick?.(info.event.id)}
          dateClick={(info) => onDateClick?.(info.date)}
          eventContent={(arg) => {
            const view = arg.view.type
            const isMonth = view === 'dayGridMonth'
            const isList = view === 'listWeek'
            const color = arg.event.backgroundColor || '#6366f1'
            const start = arg.event.start
            const timeText = start && !arg.event.allDay
              ? DateTime.fromJSDate(start).setZone(TZ).toFormat('h:mma').toLowerCase()
              : ''
            const title = arg.event.title

            if (isList) return null

            if (isMonth) {
              return (
                <div
                  className="px-2 py-[3px] text-[11.5px] w-full overflow-hidden rounded-md transition-all hover:translate-y-[-1px] cursor-pointer"
                  style={{
                    background: hexToRgba(color, 0.16),
                    borderLeft: `2.5px solid ${color}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {timeText && (
                      <span className="text-neutral-700 text-[10px] tabular-nums shrink-0 font-semibold">
                        {timeText}
                      </span>
                    )}
                    <span className="truncate font-medium text-neutral-900">{title}</span>
                  </div>
                </div>
              )
            }

            return (
              <div
                className="h-full w-full rounded-lg overflow-hidden flex cursor-pointer shadow-sm"
                style={{
                  background: hexToRgba(color, 0.18),
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div className="px-2 py-1.5 text-xs flex-1 min-h-0">
                  <div className="font-semibold text-neutral-900 truncate leading-tight">{title}</div>
                  {timeText && (
                    <div className="text-[10.5px] text-neutral-700 mt-0.5 tabular-nums">
                      {timeText}
                    </div>
                  )}
                </div>
              </div>
            )
          }}
          noEventsContent={() => (
            <div className="text-center py-12 text-neutral-500">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">No events in this range</p>
            </div>
          )}
        />
      </div>
    </div>
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(n.substring(0, 2), 16)
  const g = parseInt(n.substring(2, 4), 16)
  const b = parseInt(n.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
