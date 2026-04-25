'use server'

import { createClient } from '@/lib/supabase/server'
import { DateTime } from 'luxon'

const TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'America/Chicago'

type ImportResult = { imported: number; skipped: number; errors: string[] }

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuote) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') inQuote = false
      else cur += c
    } else {
      if (c === '"') inQuote = true
      else if (c === ',') { row.push(cur); cur = '' }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
      else if (c === '\r') { /* skip */ }
      else cur += c
    }
  }
  if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim().length > 0))
}

export async function importCalendly(formData: FormData): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ...result, errors: ['Not authenticated'] }

  const file = formData.get('file') as File
  if (!file) return { ...result, errors: ['No file'] }

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length < 2) return { ...result, errors: ['Empty CSV'] }

  const header = rows[0].map(h => h.trim().toLowerCase())
  const idx = (keys: string[]) => {
    for (const k of keys) {
      const i = header.indexOf(k)
      if (i !== -1) return i
    }
    return -1
  }
  const iName = idx(['event name', 'event type', 'event', 'name'])
  const iStart = idx(['start date & time', 'start date/time', 'start date and time', 'start time', 'start'])
  const iEnd = idx(['end date & time', 'end date/time', 'end date and time', 'end time', 'end'])
  const iInvitee = idx(['invitee name', 'invitee', 'name'])
  const iEmail = idx(['invitee email', 'email', 'invitee email address'])
  const iLocation = idx(['location', 'event location'])
  const iNotes = idx(['questions & answers', 'notes', 'text reminder number'])

  if (iStart === -1 || iEnd === -1) {
    return { ...result, errors: ['CSV missing start/end columns'] }
  }

  const { data: mtypes } = await supabase
    .from('meeting_types').select('id, name').eq('owner_id', user.id)
  const calendlyType = mtypes?.find(m => m.name.toLowerCase().includes('calendly'))
    || mtypes?.find(m => m.name.toLowerCase().includes('1-on-1'))
    || mtypes?.[0]

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    try {
      const title = (iName !== -1 ? row[iName] : '') || 'Calendly meeting'
      const startRaw = row[iStart]?.trim()
      const endRaw = row[iEnd]?.trim()
      if (!startRaw || !endRaw) { result.skipped++; continue }

      const tryParse = (s: string): DateTime => {
        let dt = DateTime.fromISO(s, { zone: TZ })
        if (dt.isValid) return dt
        dt = DateTime.fromFormat(s, 'yyyy-LL-dd HH:mm:ss', { zone: TZ })
        if (dt.isValid) return dt
        dt = DateTime.fromFormat(s, 'LL/dd/yyyy h:mm a', { zone: TZ })
        if (dt.isValid) return dt
        dt = DateTime.fromFormat(s, 'LL/dd/yyyy HH:mm', { zone: TZ })
        if (dt.isValid) return dt
        return DateTime.fromJSDate(new Date(s)).setZone(TZ)
      }
      const startDt = tryParse(startRaw)
      const endDt = tryParse(endRaw)
      if (!startDt.isValid || !endDt.isValid) {
        result.errors.push(`Row ${r + 1}: bad date "${startRaw}"`)
        result.skipped++
        continue
      }

      const startsIso = startDt.toUTC().toISO()!
      const endsIso = endDt.toUTC().toISO()!

      // Dedupe: same title + start
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('owner_id', user.id)
        .eq('title', title)
        .eq('starts_at', startsIso)
        .maybeSingle()

      if (existing) { result.skipped++; continue }

      const invitee = iInvitee !== -1 ? row[iInvitee]?.trim() : ''
      const email = iEmail !== -1 ? row[iEmail]?.trim() : ''
      const location = iLocation !== -1 ? row[iLocation]?.trim() : ''
      const notes = iNotes !== -1 ? row[iNotes]?.trim() : ''
      const description = [invitee && `Invitee: ${invitee}`, email && `Email: ${email}`, notes].filter(Boolean).join('\n')

      const { data: inserted, error } = await supabase.from('events').insert({
        owner_id: user.id,
        title,
        description,
        location,
        starts_at: startsIso,
        ends_at: endsIso,
        all_day: false,
        meeting_type_id: calendlyType?.id ?? null,
        busy_level: 'busy',
        visibility: 'default',
        source: 'calendly',
      }).select('id').single()

      if (error) { result.errors.push(`Row ${r + 1}: ${error.message}`); result.skipped++; continue }

      if (email && inserted?.id) {
        await supabase.from('event_attendees').insert({
          event_id: inserted.id,
          email,
          rsvp_status: 'accepted',
        })
      }

      result.imported++
    } catch (e: any) {
      result.errors.push(`Row ${r + 1}: ${e.message}`)
      result.skipped++
    }
  }

  return result
}
