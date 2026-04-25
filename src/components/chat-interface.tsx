'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, Sparkles } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

export function ChatInterface({
  initialMessages,
  userName,
}: {
  initialMessages: Message[]
  userName: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (e?: React.FormEvent, presetText?: string) => {
    e?.preventDefault()
    const text = (presetText ?? input).trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error ?? 'Chat failed')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, ran into an error: ${err.message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'What do I have today?',
    'Any conflicts this week?',
    'What tasks are overdue?',
    'Suggest a good time for a 1-hour meeting',
  ]

  return (
    <div className="bg-white rounded-xl border flex flex-col h-[calc(100vh-180px)]">
      <div className="px-6 py-4 border-b flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="font-semibold">Calendar Assistant</div>
          <div className="text-xs text-slate-500">Ask anything about your schedule</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-600 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Hi {userName.split(' ')[0]}</h3>
            <p className="text-sm text-slate-600 mb-6">I can see your calendar. Try one of these:</p>
            <div className="grid sm:grid-cols-2 gap-2 max-w-md mx-auto">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(undefined, s)}
                  className="text-left text-sm p-3 rounded-lg border hover:bg-slate-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
              m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
            </div>
            {m.role === 'user' && (
              <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-slate-700" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-slate-100 rounded-2xl px-4 py-3 flex gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => sendMessage(e)} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your calendar…"
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}