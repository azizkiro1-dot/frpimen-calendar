'use client'

import { useState, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createTask, toggleTask, deleteTask } from '@/app/actions/tasks'
import { Plus, Trash2, Check, Clock, AlertCircle, ListTodo, Flame, Circle } from 'lucide-react'
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

const priorityMeta: Record<string, { color: string; bg: string; ring: string; label: string }> = {
  urgent: { color: '#dc2626', bg: '#fef2f2', ring: '#fecaca', label: 'Urgent' },
  high: { color: '#ea580c', bg: '#fff7ed', ring: '#fed7aa', label: 'High' },
  normal: { color: '#737373', bg: '#fafafa', ring: '#e5e5e5', label: 'Normal' },
  low: { color: '#2563eb', bg: '#eff6ff', ring: '#bfdbfe', label: 'Low' },
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
      if (filter === 'today') return t.due_at && DateTime.fromISO(t.due_at, { zone: 'utc' }).setZone(TZ).hasSame(now, 'day')
      if (filter === 'high') return t.priority === 'urgent' || t.priority === 'high'
      return true
    })
  }, [openTasks, filter])

  const overdueCount = openTasks.filter(t => t.due_at && DateTime.fromISO(t.due_at, { zone: 'utc' }) < DateTime.now()).length
  const todayCount = openTasks.filter(t => t.due_at && DateTime.fromISO(t.due_at, { zone: 'utc' }).setZone(TZ).hasSame(DateTime.now().setZone(TZ), 'day')).length
  const highCount = openTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length

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
      <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden border border-neutral-200" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 50%, #fde68a 100%)' }}>
        <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-800 font-semibold">Tasks</p>
            <h1 className="text-3xl font-bold text-neutral-900 mt-1">{openTasks.length} open</h1>
            <p className="text-sm text-neutral-700 mt-1">
              {overdueCount > 0 ? `${overdueCount} overdue · ` : ''}{todayCount} due today
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="rounded-full shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" /> New task
          </Button>
        </div>
        <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #fbbf24, transparent 70%)' }} />
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        {filterChips.map(c => {
          const Icon = c.icon
          const active = filter === c.id
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition border ${
                active
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-neutral-200 hove:border-neutral-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {c.label}
              <span className={`text-xs ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>{c.count}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-600">All clear</p>
          </div>
        ) : (
          filtered.map((task) => {
            const meta = priorityMeta[task.priority] ?? priorityMeta.normal
            const due = task.due_at ? formatDue(task.due_at) : null
            const dueColor =
              due?.tone === 'overdue' ? 'text-red-600' :
              due?.tone === 'today' ? 'text-amber-600' :
              due?.tone === 'soon' ? 'text-orange-600' : 'text-neutral-500'
            return (
              <div
                key={task.id}
                className="group bg-white rounded-xl border border-neutral-200 p-3.5 hover:border-neutral-300 hover:shadow-sm transition relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: meta.color }} />
                <div className="flex items-start gap-3 pl-2">
                  <button
                    onClick={() => handleToggle(task.id, task.status)}
                    disabled={isPending}
                    className="mt-0.5 h-5 w-5 rounded-full border-2 border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 transition flex items-center justify-center shrink-0"
                  >
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-neutral-900">{task.title}</span>
                      {task.priority !== 'normal' && (
                        <span
                          className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                          style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.ring}` }}
                        >
                          {meta.label}
                        </span>
                      )}
                    </div>
                    {due && (
                      <div className={`text-xs mt-1 flex items-center gap-1 ${dueColor}`}>
                        <Clock className="h-3 w-3" />
                        {due.text}
                        {due.tone === 'overdue' && <span className="font-semibold">· Overdue</span>}
                      </div>
                    )}
                    {task.notes && <p className="text-sm text-neutral-600 mt-1.5 leading-relaxed">{task.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 transition h-7 w-7 rounded-md flex items-center justify-center hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {doneTasks.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-2 px-1">Recently completed</h2>
          <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
            {doneTasks.map((task) => (
              <div key={task.id} className="px-4 py-2.5 flex items-center gap-3 text-neutral-500">
                <button
                  onClick={() => handleToggle(task.id, task.status)}
                  disabled={isPending}
                  className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                >
                  <Check className="h-3 w-3 text-white" />
                </button>
                <span className="flex-1 line-through text-sm">{task.title}</span>
                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={isPending}
                  className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-neutral-100 text-neutral-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
