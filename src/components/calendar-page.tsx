'use client'

import { useState } from 'react'
import { CalendarView, type CalendarEvent } from '@/components/calendar-view'
import { EventDialog, type MeetingType, type EventData } from '@/components/event-dialog'

type Props = {
  events: CalendarEvent[]
  rawEvents: any[]
  meetingTypes: MeetingType[]
}

export function CalendarPage({ events, rawEvents, meetingTypes }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | null>(null)

  const handleCreate = () => {
    setSelectedEvent(null)
    setDefaultDate(new Date())
    setDialogOpen(true)
  }

  const handleEventClick = (id: string) => {
    const raw = rawEvents.find((e) => e.id === id)
    if (!raw) return
    setSelectedEvent({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      location: raw.location,
      starts_at: raw.starts_at,
      ends_at: raw.ends_at,
      all_day: raw.all_day,
      meeting_type_id: raw.meeting_type_id,
      busy_level: raw.busy_level,
      visibility: raw.visibility,
    })
    setDefaultDate(null)
    setDialogOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setSelectedEvent(null)
    setDefaultDate(date)
    setDialogOpen(true)
  }

  return (
    <>
      <CalendarView
        events={events}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        onCreateClick={handleCreate}
      />
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        meetingTypes={meetingTypes}
        event={selectedEvent}
        defaultDate={defaultDate}
      />
    </>
  )
}