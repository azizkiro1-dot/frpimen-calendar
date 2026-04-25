import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const messages: { role: 'user' | 'assistant'; content: string }[] = body.messages ?? []
    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages' }, { status: 400 })
    }

    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - 1)
    const end = new Date(now)
    end.setDate(end.getDate() + 30)
    const nowLocalStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(now)

    const { data: events } = await supabase
      .from('events')
      .select('title, starts_at, ends_at, location, meeting_type_id, busy_level')
      .eq('owner_id', user.id)
      .gte('starts_at', start.toISOString())
      .lte('starts_at', end.toISOString())
      .order('starts_at', { ascending: true })
      .limit(50)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, status, priority, due_date')
      .eq('owner_id', user.id)
      .eq('status', 'open')
      .order('due_date', { ascending: true })
      .limit(30)

    const tz = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'America/Chicago'
    const system = `You are a helpful calendar assistant for Fr. Pimen, a Catholic priest in Prosper, TX.
Current date/time in Central Time: ${nowLocalStr}. All event times below are in UTC — convert to Central Time for display.

Upcoming events (next 30 days):
${(events ?? []).map(e => { const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); return `- ${e.title} | ${fmt.format(new Date(e.starts_at))} to ${new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' }).format(new Date(e.ends_at))} | ${e.location ?? 'no location'} | ${e.busy_level}`; }).join('\n') || '(none)'}

Open tasks:
${(tasks ?? []).map(t => `- ${t.title} | priority: ${t.priority} | due: ${t.due_date ?? 'no date'}`).join('\n') || '(none)'}

Answer concisely. Use friendly tone. When listing events or tasks, format cleanly.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const text = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')

    await supabase.from('chat_messages').insert([
      { owner_id: user.id, role: 'user', content: messages[messages.length - 1].content },
      { owner_id: user.id, role: 'assistant', content: text },
    ])

    return NextResponse.json({ text })
  } catch (err: any) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
