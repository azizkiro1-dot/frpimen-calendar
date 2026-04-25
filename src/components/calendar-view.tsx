'use client'

import { useRef, useState, memo, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import rrulePlugin from '@fullcalendar/rrule'
import { Button } from '@/components/ui/button'
import { DateTime } from 'luxon'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

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

const dayGradients = [
  'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
  'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
  'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
  'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
  'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
  'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
  'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)',
]

export function CalendarView({ events: events, onEventClick, onDateClick, onCreateClick }: Props) {
  const calendarRef = useRef<FullCalendar | null>(null)
  if (typeof window !== 'undefined' && events[0]) (window as any).DEBUG_TZ_CLIENT = events[0]
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth')
  const [title, setTitle] = useState('')

  const goPrev = () => calendarRef.current?.getApi().prev()
  const goNext = () => calendarRef.current?.getApi().next()
  const goToday = () => calendarRef.current?.getApi().today()
  const changeView = (view: typeof currentView) => {
    calendarRef.current?.getApi().changeView(view)
    setCurrentView(view)
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={goToday} className="rounded-full">Today</Button>
          <div className="flex items-center">
            <button onClick={goPrev} className="h-8 w-8 rounded-full hover:bg-neutral-100 flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={goNext} className="h-8 w-8 rounded-full hover:bg-neutral-100 flex items-center justify-center">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold ml-2 truncate">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-neutral-100 p-1">
            {(['dayGridMonth','timeGridWeek','timeGridDay','listWeek'] as const).map((v) => (
              <button
                key={v}
                onClick={() => changeView(v)}
                className={`px-3 py-1 text-xs sm:text-sm rounded-full transition ${
                  currentView === v ? 'bg-white shadow-sm font-medium text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {v === 'dayGridMonth' ? 'Month' : v === 'timeGridWeek' ? 'Week' : v === 'timeGridDay' ? 'Day' : 'List'}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={onCreateClick} className="rounded-full shrink-0">
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">New event</span>
          </Button>
        </div>
      </div>
      <div className="p-3 sm:p-5">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, rrulePlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          events={events}
          height="auto"
          nowIndicator
          dayMaxEvents={3}
          moreLinkClick="popover"
          dayPopoverFormat={{ month: "long", day: "numeric", year: "numeric" }}
          editable
          selectable
          timeZone={TZ}
          eventDisplay="block"
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          allDaySlot={true}
          allDayText="all day"
          expandRows
          firstDay={0}
          datesSet={(arg) => setTitle(arg.view.title)}
          eventClick={(info) => onEventClick?.(info.event.id)}
          dateClick={(info) => onDateClick?.(info.date)}
          dayHeaderContent={(arg) => {
            const dt = DateTime.fromJSDate(arg.date).setZone(TZ)
            const isToday = arg.isToday
            const dayName = dt.toFormat('ccc').toLowerCase()
            const dayNum = dt.toFormat('d')
            const grad = dayGradients[dt.weekday % 7]
            if (currentView === 'dayGridMonth') {
              return (
                <div className="text-[10px] uppercase tracking-[0.12em] text-neutral-500 font-medium py-2">
                  {dayName}
                </div>
              )
            }
            return (
              <div className={`flex flex-col items-center justify-center py-2 px-2 rounded-2xl mx-1 my-1 ${isToday ? 'shadow-md ring-1 ring-neutral-200' : ''}`}
                style={{ background: isToday ? '#fff' : grad }}>
                <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-700 font-medium">{dayName}</span>
                <span className={`text-2xl font-semibold leading-none mt-0.5 ${isToday ? 'text-neutral-900' : 'text-neutral-800'}`}>{dayNum}</span>
              </div>
            )
          }}
          eventContent={(arg) => {
            const isMonth = arg.view.type === 'dayGridMonth'
            const isList = arg.view.type === 'listWeek'
            const color = arg.event.backgroundColor || '#6366f1'
            const start = arg.event.start
            const end = arg.event.end
            const timeText = start && !arg.event.allDay
              ? DateTime.fromJSDate(start).setZone(TZ).toFormat('h:mma').toLowerCase()
              : ''
            const title = arg.event.title

            if (isList) {
              return null
            }

            if (isMonth) {
              return (
                <div
                  className="px-2 py-1 text-[11px] w-full overflow-hidden rounded-md hover:scale-[1.02] transition-transform"
                  style={{ background: hexToRgba(color, 0.18), borderLeft: `2.5px solid ${color}` }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {timeText && <span className="text-neutral-700 text-[10px] tabular-nums shrink-0 font-medium">{timeText}</span>}
                    <span className="truncate font-semibold text-neutral-900">{title}</span>
                  </div>
                </div>
              )
            }

            return (
              <div
                className="h-full w-full rounded-lg overflow-hidden flex flex-col cursor-pointer"
                style={{
                  background: hexToRgba(color, 0.15),
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div className="px-2 py-1 text-xs flex-1 min-h-0">
                  <div className="font-semibold text-neutral-900 truncate leading-tight">{title}</div>
                  {timeText && <div className="text-[10.5px] text-neutral-700 mt-0.5 tabular-nums">{timeText}</div>}
                </div>
              </div>
            )
          }}
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
