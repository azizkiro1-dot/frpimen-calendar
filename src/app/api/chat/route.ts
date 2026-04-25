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

    const { data: events } = await supabase
      .from('events')
      .select('title, start_time, end_time, location, meeting_type_id, busy_level')
      .eq('owner_id', user.id)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time', { ascending: true })
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
Current date/time: ${now.toISOString()} (timezone: ${tz}).

Upcoming events (next 30 days):
${(events ?? []).map(e => `- ${e.title} | ${e.start_time} to ${e.end_time} | ${e.location ?? 'no location'} | busy: ${e.busy_level}`).join('\n') || '(none)'}

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
