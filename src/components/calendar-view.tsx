'use client'

import { useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import rrulePlugin from '@fullcalendar/rrule'
import { Button } from '@/components/ui/button'
import { DateTime } from 'luxon'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

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

export function CalendarView({ events, onEventClick, onDateClick, onCreateClick }: Props) {
  const calendarRef = useRef<FullCalendar | null>(null)
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
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-wrap gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <Button variant="ghost" size="icon" onClick={goPrev} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goNext} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-base sm:text-lg font-semibold ml-1 sm:ml-2 truncate">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-slate-50 p-0.5">
            {(['dayGridMonth','timeGridWeek','timeGridDay','listWeek'] as const).map((v) => (
              <button
                key={v}
                onClick={() => changeView(v)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition ${
                  currentView === v ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v === 'dayGridMonth' ? 'Month' : v === 'timeGridWeek' ? 'Week' : v === 'timeGridDay' ? 'Day' : 'List'}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={onCreateClick} className="shrink-0">
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">New event</span>
          </Button>
        </div>
      </div>
      <div className="p-2 sm:p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, rrulePlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          events={events}
          height="auto"
          nowIndicator
          dayMaxEvents={3}
          editable
          selectable
          timeZone="America/Chicago"
          eventDisplay="block"
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          expandRows
          datesSet={(arg) => setTitle(arg.view.title)}
          eventClick={(info) => onEventClick?.(info.event.id)}
          dateClick={(info) => onDateClick?.(info.date)}
          eventContent={(arg) => {
            const isMonth = arg.view.type === 'dayGridMonth'
            const color = arg.event.backgroundColor || '#3b82f6'
            const start = arg.event.start
            const end = arg.event.end
            const timeText = start
              ? (arg.event.allDay
                ? ''
                : DateTime.fromJSDate(start).setZone('America/Chicago').toFormat('h:mma').toLowerCase())
              : ''
            const title = arg.event.title
            if (isMonth) {
              return (
                <div
                  className="flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] w-full overflow-hidden"
                  style={{ color: '#0f172a' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
                  {timeText && <span className="font-normal text-slate-500 text-[10px] shrink-0">{timeText}</span>}
                  <span className="truncate font-medium">{title}</span>
                </div>
              )
            }
            return (
              <div
                className="h-full w-full rounded-md overflow-hidden flex flex-col"
                style={{ background: hexToRgba(color, 0.12), borderLeft: `3px solid ${color}` }}
              >
                <div className="px-2 py-1 text-xs">
                  <div className="font-semibold text-slate-900 truncate">{title}</div>
                  {timeText && <div className="text-[11px] text-slate-600">{timeText}</div>}
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
