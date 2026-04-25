'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Calendar, ListTodo, AlertCircle, Copy, Check, Square } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  { icon: Calendar, label: 'What do I have today?', q: 'What do I have today?' },
  { icon: ListTodo, label: 'My open tasks',         q: 'What are my open tasks?' },
  { icon: Sparkles, label: "This week's overview",  q: "Summarize this week's schedule" },
  { icon: AlertCircle, label: 'Find conflicts',     q: 'Are there any scheduling conflicts this week?' },
]

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
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async (e?: React.FormEvent, presetText?: string) => {
    e?.preventDefault()
    const text = (presetText ?? input).trim()
    if (!text || loading) return
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error ?? 'Chat failed')
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, ran into an error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const copy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 1400)
    } catch {}
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-3rem)] max-w-3xl mx-auto w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="px-5 py-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet-500 via-pink-500 to-amber-500 flex items-center justify-center shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-[15px] leading-tight">Calendar Assistant</h1>
            <p className="text-xs text-neutral-500">Knows your schedule · powered by Claude</p>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-5 pb-3">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="py-10 text-center"
          >
            <div className="inline-block mb-4">
              <div className="h-14 w-14 mx-auto rounded-3xl bg-gradient-to-br from-violet-500 via-pink-500 to-amber-500 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">How can I help, {userName.split(' ')[0]}?</h2>
            <p className="text-sm text-neutral-500 mt-1.5">Ask anything about your calendar or tasks</p>

            <div className="grid sm:grid-cols-2 gap-2 mt-6 max-w-xl mx-auto">
              {SUGGESTIONS.map((s, i) => {
                const Icon = s.icon
                return (
                  <motion.button
                    key={s.q}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(undefined, s.q)}
                    className="text-left px-4 py-3 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm transition flex items-center gap-3"
                  >
                    <Icon className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm text-neutral-700">{s.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`group py-4 px-1 ${m.role === 'assistant' ? '' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  m.role === 'user'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-gradient-to-br from-violet-500 via-pink-500 to-amber-500 text-white'
                }`}>
                  {m.role === 'user'
                    ? <span className="text-[11px] font-semibold">{userName[0]?.toUpperCase() ?? 'U'}</span>
                    : <Sparkles className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12.5px] font-semibold text-neutral-900">
                      {m.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                  </div>
                  <FormattedContent text={m.content} />
                  {m.role === 'assistant' && (
                    <div className="opacity-0 group-hover:opacity-100 transition mt-2">
                      <button
                        onClick={() => copy(m.content, idx)}
                        className="text-[11.5px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-neutral-100"
                      >
                        {copiedIdx === idx ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        {copiedIdx === idx ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-4 px-1 flex items-start gap-3"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 via-pink-500 to-amber-500 flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex items-center gap-1 mt-2.5">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-neutral-400"
                  animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Composer */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={sendMessage}
        className="px-3 sm:px-5 pb-4 pt-2 border-t border-neutral-100 bg-white/80 backdrop-blur"
      >
        <div className="relative rounded-2xl border border-neutral-200 bg-white shadow-sm focus-within:border-neutral-400 focus-within:shadow-md transition">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Message your calendar..."
            className="w-full resize-none bg-transparent border-0 outline-none px-4 py-3.5 pr-12 text-[14.5px] placeholder:text-neutral-400 max-h-40"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 bottom-2 h-9 w-9 rounded-xl flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed
                       bg-gradient-to-br from-violet-500 via-pink-500 to-amber-500 text-white hover:shadow-md hover:scale-105 active:scale-95"
            aria-label="Send"
          >
            {loading ? <Square className="h-3.5 w-3.5 fill-current" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="text-[10.5px] text-neutral-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </motion.form>
    </div>
  )
}

// Lightweight markdown-ish renderer for **bold**, line breaks, and lists
function FormattedContent({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="text-[14.5px] text-neutral-800 leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-neutral-400 mt-1.5">•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          )
        }
        if (!trimmed) return <div key={i} className="h-2" />
        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

function renderInline(s: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let lastIdx = 0
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g
  let m
  let key = 0
  while ((m = re.exec(s)) !== null) {
    if (m.index > lastIdx) parts.push(s.slice(lastIdx, m.index))
    if (m[1]) parts.push(<strong key={key++} className="font-semibold text-neutral-900">{m[1]}</strong>)
    else if (m[2]) parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-neutral-100 text-[13px] font-mono text-neutral-800">{m[2]}</code>)
    lastIdx = m.index + m[0].length
  }
  if (lastIdx < s.length) parts.push(s.slice(lastIdx))
  return <>{parts}</>
}
