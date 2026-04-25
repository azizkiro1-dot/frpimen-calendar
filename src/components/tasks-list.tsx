'use client'

import { useState, useTransition, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createTask, toggleTask, deleteTask } from '@/app/actions/tasks'
import { Plus, Trash2, Check, Clock, AlertCircle, ListTodo, Flame } from 'lucide-react'
import { DateTime } from 'luxon'

type Task = {
  id: string
  title: string
  notes: string | null
  due_at: string | null
  priority: string
  status: string
  completed_at: string | null
  created_at: string
}

const TZ = 'America/Chicago'

const cardThemes: Record<string, { bg: string; ring: string; chip: string; chipText: string; tone: string }> = {
  urgent: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', ring: '#fca5a5', chip: '#dc2626', chipText: '#fff', tone: '#dc2626' },
  high:   { bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', ring: '#fdba74', chip: '#ea580c', chipText: '#fff', tone: '#ea580c' },
  normal: { bg: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)', ring: '#d4d4d4', chip: '#525252', chipText: '#fff', tone: '#525252' },
  low:    { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', ring: '#93c5fd', chip: '#2563eb', chipText: '#fff', tone: '#2563eb' },
}

function formatDue(iso: string): { text: string; tone: 'overdue' | 'today' | 'soon' | 'later' } {
  const dt = DateTime.fromISO(iso, { zone: 'utc' }).setZone(TZ)
  const now = DateTime.now().setZone(TZ)
  const diffH = dt.diff(now, 'hours').hours
  const isToday = dt.hasSame(now, 'day')
  const isTomorrow = dt.hasSame(now.plus({ days: 1 }), 'day')
  let text = ''
  if (isToday) text = `Today, ${dt.toFormat('h:mm a')}`
  else if (isTomorrow) text = `Tomorrow, ${dt.toFormat('h:mm a')}`
  else text = dt.toFormat('EEE LLL d, h:mm a')
  let tone: 'overdue' | 'today' | 'soon' | 'later' = 'later'
  if (diffH < 0) tone = 'overdue'
  else if (isToday) tone = 'today'
  else if (diffH < 48) tone = 'soon'
  return { text, tone }
}

export function TasksList({ tasks }: { tasks: Task[] }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'high'>('all')

  const openTasks = useMemo(() => tasks.filter(t => t.status !== 'done'), [tasks])
  const doneTasks = useMemo(() => tasks.filter(t => t.status === 'done').slice(0, 12), [tasks])

  const filtered = useMemo(() => {
    const now = DateTime.now().setZone(TZ)
    return openTasks.filter(t => {
      if (filter === 'all') return true
      if (filter === 'overdue') return t.due_at && DateTime.fromISO(t.due_at, { zone: 'utc' }) < now
      if (filter === 'today')   return t.due_at && DateTime.fromISO(t.due_at, { zone: 'utc' }).setZone(TZ).hasSame(now, 'day')
      if (filter === 'high')    return t.priority === 'urgent' || t.priority === 'high'
      return true
    })
  }, [openTasks, filter])

  const overdueCount = openTasks.filter(t => t.due_at && DateTime.fromISO(t.due_at, { zone: 'utc' }) < DateTime.now()).length
  const todayCount   = openTasks.filter(t => t.due_at && DateTime.fromISO(t.due_at, { zone: 'utc' }).setZone(TZ).hasSame(DateTime.now().setZone(TZ), 'day')).length
  const highCount    = openTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      const res = await createTask(fd)
      if ((res as any)?.error) setError((res as any).error)
      else { setDialogOpen(false); form.reset() }
    })
  }
  const handleToggle = (id: string, status: string) => startTransition(() => { toggleTask(id, status) })
  const handleDelete = (id: string) => {
    if (!confirm('Delete this task?')) return
    startTransition(() => { deleteTask(id) })
  }

  const filterChips: { id: typeof filter; label: string; count: number; icon: any }[] = [
    { id: 'all', label: 'All', count: openTasks.length, icon: ListTodo },
    { id: 'today', label: 'Today', count: todayCount, icon: Clock },
    { id: 'overdue', label: 'Overdue', count: overdueCount, icon: AlertCircle },
    { id: 'high', label: 'High priority', count: highCount, icon: Flame },
  ]

  return (
    <div className="space-y-5">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-neutral-200/80 shadow-sm bg-white"
      >
        <div className="absolute inset-0 -z-0 opacity-90"
             style={{ background: 'linear-gradient(120deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)' }} />
        <div className="absolute -right-20 -top-16 h-60 w-60 rounded-full opacity-40 -z-0"
             style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
        <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-900 font-semibold">Tasks</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-neutral-900 mt-1 tracking-tight leading-[1.05]">
              {openTasks.length === 0 ? 'All clear' : `${openTasks.length} open`}
            </h1>
            <p className="text-sm sm:text-base text-neutral-700 mt-1.5">
              {overdueCount > 0 ? `${overdueCount} overdue · ` : ''}{todayCount} due today
            </p>
          </div>
          <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
            <Button onClick={() => setDialogOpen(true)} className="rounded-full h-10 px-5 shadow-md">
              <Plus className="h-4 w-4 mr-1.5" /> New task
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        {filterChips.map(c => {
          const Icon = c.icon
          const active = filter === c.id
          return (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(c.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm transition border font-medium ${
                active
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {c.label}
              <span className={`text-xs ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>{c.count}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
            <Check className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-600">All clear</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence initial={false}>
            {filtered.map((task, i) => {
              const theme = cardThemes[task.priority] ?? cardThemes.normal
              const due = task.due_at ? formatDue(task.due_at) : null
              const dueColor =
                due?.tone === 'overdue' ? 'text-red-700' :
                due?.tone === 'today'   ? 'text-amber-700' :
                due?.tone === 'soon'    ? 'text-orange-700' : 'text-neutral-600'
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.32, delay: i * 0.025, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2 }}
                  className="group relative overflow-hidden rounded-2xl p-4 border shadow-sm cursor-default"
                  style={{ background: theme.bg, borderColor: theme.ring }}
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-30"
                       style={{ background: `radial-gradient(circle, ${theme.tone}, transparent 70%)` }} />
                  <div className="relative flex items-start gap-3">
                    <button
                      onClick={() => handleToggle(task.id, task.status)}
                      disabled={isPending}
                      className="mt-0.5 h-5 w-5 rounded-full border-2 bg-white/80 hover:bg-white transition flex items-center justify-center shrink-0"
                      style={{ borderColor: theme.tone }}
                      aria-label="Mark complete"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        {task.priority !== 'normal' && (
                          <span
                            className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: theme.chipText, background: theme.chip }}
                          >
                            {task.priority}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-neutral-900 text-[15px] leading-snug">{task.title}</h3>
                      {task.notes && <p className="text-[13px] text-neutral-700 mt-1.5 leading-relaxed line-clamp-3">{task.notes}</p>}
                      {due && (
                        <div className={`text-xs mt-2.5 flex items-center gap-1 ${dueColor} font-medium`}>
                          <Clock className="h-3 w-3" />
                          {due.text}
                          {due.tone === 'overdue' && <span className="font-semibold">· Overdue</span>}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={isPending}
                      className="opacity-0 group-hover:opacity-100 transition h-7 w-7 rounded-md flex items-center justify-center bg-white/70 hover:bg-white text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Recently completed */}
      {doneTasks.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-2 px-1">Recently completed</h2>
          <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
            {doneTasks.map(task => (
              <motion.div
                key={task.id}
                layout
                className="px-4 py-2.5 flex items-center gap-3 text-neutral-500"
              >
                <button
                  onClick={() => handleToggle(task.id, task.status)}
                  disabled={isPending}
                  className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                >
                  <Check className="h-3 w-3 text-white" />
                </button>
                <span className="flex-1 line-through text-sm">{task.title}</span>
                <button onClick={() => handleDelete(task.id)} disabled={isPending}
                        className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-neutral-100 text-neutral-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* New task dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white rounded-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>New task</DialogTitle>
              <DialogDescription>Add an action item with optional due date</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="What needs doing?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="due_at">Due</Label>
                  <Input id="due_at" name="due_at" type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="normal">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} placeholder="Optional details" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="rounded-full px-5">{isPending ? 'Saving...' : 'Add task'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
