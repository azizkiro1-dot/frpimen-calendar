export async function refreshGoogleToken(refreshToken: string) {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Token refresh failed: ${text}`)
    }
    const data = await resp.json()
    return {
      access_token: data.access_token as string,
      expires_in: data.expires_in as number,
    }
  }
  
  export async function listGoogleEvents(
    accessToken: string,
    timeMin: string,
    timeMax: string
  ) {
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
    url.searchParams.set('timeMin', timeMin)
    url.searchParams.set('timeMax', timeMax)
    url.searchParams.set('maxResults', '250')
    url.searchParams.set('singleEvents', 'true')
    url.searchParams.set('orderBy', 'startTime')
  
    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Google Calendar API error: ${resp.status} ${text}`)
    }
    const data = await resp.json()
    return (data.items ?? []) as GoogleCalendarEvent[]
  }
  
  export type GoogleCalendarEvent = {
    id: string
    summary?: string
    description?: string
    location?: string
    start: { dateTime?: string; date?: string; timeZone?: string }
    end: { dateTime?: string; date?: string; timeZone?: string }
    status?: string
    visibility?: string
    transparency?: string
    recurringEventId?: string
  }