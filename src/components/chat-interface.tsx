'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, Sparkles, Calendar, Clock, ListTodo, AlertCircle } from 'lucide-react'

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
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }])
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
    { icon: Calendar, text: 'What do I have today?', gradient: 'from-blue-50 to-cyan-50' },
    { icon: AlertCircle, text: 'Any conflicts this week?', gradient: 'from-amber-50 to-orange-50' },
    { icon: ListTodo, text: 'What tasks are overdue?', gradient: 'from-rose-50 to-pink-50' },
    { icon: Clock, text: 'Suggest a time for a 1-hour meeting', gradient: 'from-emerald-50 to-teal-50' },
  ]

  return (
    <div className="bg-white rounded-2xl border shadow-sm flex flex-col h-[calc(100vh-180px)] overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3 bg-gradient-to-r from-violet-50 via-blue-50 to-cyan-50">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="font-semibold text-neutral-900">Calendar Assistant</div>
          <div className="text-xs text-neutral-600">Powered by Claude · knows your schedule</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="text-center py-6 sm:y-10">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-1.5 text-neutral-900">Hi {userName.split(' ')[0]}</h3>
            <p className="text-sm text-neutral-600 mb-7 max-w-sm mx-auto">Ask anything about your calendar, tasks, or schedule. Try a suggestion to get started.</p>
            <div className="grid sm:grid-cols-2 gap-2.5 max-w-xl mx-auto">
              {suggestions.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.text}
                    onClick={() => sendMessage(undefined, s.text)}
                    className={`group relative text-left text-sm p-3.5 rounded-xl border border-neutral-200 bg-gradient-to-br ${s.gradient} hover:border-neutral-300 hover:shadow-sm transition-all overflow-hidden`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon className="h-4 w-4 text-neutral-700 mt-0.5 shrink-0" />
                      <span className="text-neutral-800 font-medium">{s.text}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-neutral-900 text-white rounded-tr-md'
                : 'bg-neutral-100 text-neutral-900 rounded-tl-md'
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
            {m.role === 'user' && (
              <div className="h-8 w-8 rounded-xl bg-neutral-200 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-neutral-700" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-neutral-100 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5 items-center">
              <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '120ms' }} />
              <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '240ms' }} />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => sendMessage(e)} className="p-3 sm:p-4 border-t border-neutral-100 flex gap-2 bg-neutral-50">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your calendar..."
          disabled={loading}
          className="flex-1 h-11 rounded-full px-5 bg-white border-neutral-200"
        />
        <Button type="submit" disabled={loading || !input.trim()} className="h-11 w-11 rounded-full p-0 shrink-0 bg-gradient-to-br from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
