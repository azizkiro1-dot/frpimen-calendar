'use client'

import { useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import rrulePlugin from '@fullcalendar/rrule'
import { Button } from '@/components/ui/button'
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
      <div className="flex items-center justify-between p-4 border-b flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <Button variant="ghost" size="icon" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-slate-50 p-1">
            {(['dayGridMonth','timeGridWeek','timeGridDay','listWeek'] as const).map((v) => (
              <button
                key={v}
                onClick={() => changeView(v)}
                className={`px-3 py-1 text-sm rounded-md transition ${
                  currentView === v ? 'bg-white shadow-sm font-medium' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v === 'dayGridMonth' ? 'Month' : v === 'timeGridWeek' ? 'Week' : v === 'timeGridDay' ? 'Day' : 'List'}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-1" />
            New event
          </Button>
        </div>
      </div>

      <div className="p-4">
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
          timeZone={process.env.NEXT_PUBLIC_APP_TIMEZONE || 'America/Chicago'}
          datesSet={(arg) => setTitle(arg.view.title)}
          eventClick={(info) => onEventClick?.(info.event.id)}
          dateClick={(info) => onDateClick?.(info.date)}
        />
      </div>
    </div>
  )
}