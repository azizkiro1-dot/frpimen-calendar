'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { CalendarView, type CalendarEvent } from '@/components/calendar-view'
import { MeetingTypeLegend } from '@/components/meeting-type-legend'
import { RecurringDeleteModal } from '@/components/recurring-delete-modal'
import { rescheduleEvent } from '@/app/actions/reschedule'
import { deleteRecurring } from '@/app/actions/delete-recurring'
import type { MeetingType, EventData } from '@/components/event-dialog'

const EventDialog = dynamic(() => import('@/components/event-dialog').then(m => m.EventDialog), { ssr: false })

type Props = {
  events: CalendarEvent[]
  rawEvents: any[]
  meetingTypes: MeetingType[]
}

export function CalendarPage({ events, rawEvents, meetingTypes }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | null>(null)
  const [recurDelete, setRecurDelete] = useState<{ id: string; date?: string } | null>(null)

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
      rrule: raw.rrule,
    })
    setDefaultDate(null)
    setDialogOpen(true)
  }
  const handleDateClick = (date: Date) => {
    setSelectedEvent(null)
    setDefaultDate(date)
    setDialogOpen(true)
  }
  const handleDrop = (id: string, startsAt: string, endsAt: string) => {
    rescheduleEvent(id, startsAt, endsAt)
  }
  const handleRecurDelete = async (scope: 'occurrence' | 'future' | 'series') => {
    if (!recurDelete) return
    await deleteRecurring(recurDelete.id, scope, recurDelete.date)
    setRecurDelete(null)
  }

  return (
    <div className="space-y-3">
      <MeetingTypeLegend types={meetingTypes} />
      <CalendarView
        events={events}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        onCreateClick={handleCreate}
        onEventDrop={handleDrop}
      />
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        meetingTypes={meetingTypes}
        event={selectedEvent}
        defaultDate={defaultDate}
      />
      <RecurringDeleteModal
        open={!!recurDelete}
        onClose={() => setRecurDelete(null)}
        onConfirm={handleRecurDelete}
      />
    </div>
  )
}
