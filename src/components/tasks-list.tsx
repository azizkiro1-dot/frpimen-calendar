'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { createTask, toggleTask, deleteTask } from '@/app/actions/tasks'
import { Plus, Trash2, CheckSquare, Square, Clock, AlertCircle } from 'lucide-react'

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

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-slate-100 text-slate-700 border-slate-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function isOverdue(dueAt: string | null, status: string) {
  if (!dueAt || status === 'done') return false
  return new Date(dueAt).getTime() < Date.now()
}

export function TasksList({ tasks }: { tasks: Task[] }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const openTasks = tasks.filter((t) => t.status !== 'done')
  const doneTasks = tasks.filter((t) => t.status === 'done').slice(0, 20)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createTask(fd)
      if (res?.error) setError(res.error)
      else {
        setDialogOpen(false)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  const handleToggle = (id: string, status: string) => {
    startTransition(() => { toggleTask(id, status) })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this task?')) return
    startTransition(() => { deleteTask(id) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-slate-600 mt-1">
            {openTasks.length} open · {doneTasks.length} done
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New task
        </Button>
      </div>

      <div className="bg-white rounded-xl border divide-y">
        {openTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No open tasks. Nice work.
          </div>
        ) : (
          openTasks.map((task) => (
            <div key={task.id} className="p-4 flex items-start gap-3 hover:bg-slate-50">
              <button
                onClick={() => handleToggle(task.id, task.status)}
                disabled={isPending}
                className="mt-0.5 text-slate-400 hover:text-slate-900"
              >
                <Square className="h-5 w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{task.title}</span>
                  <Badge variant="outline" className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                  {isOverdue(task.due_at, task.status) && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
                {task.due_at && (
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(task.due_at)}
                  </div>
                )}
                {task.notes && <p className="text-sm text-slate-600 mt-1">{task.notes}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} disabled={isPending}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {doneTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-2">Recently completed</h2>
          <div className="bg-white rounded-xl border divide-y">
            {doneTasks.map((task) => (
              <div key={task.id} className="p-3 flex items-center gap-3 text-slate-500">
                <button
                  onClick={() => handleToggle(task.id, task.status)}
                  disabled={isPending}
                  className="text-green-600"
                >
                  <CheckSquare className="h-5 w-5" />
                </button>
                <span className="flex-1 line-through text-sm">{task.title}</span>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} disabled={isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>New task</DialogTitle>
              <DialogDescription>Add an action item with optional due date.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required />
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
                <Textarea id="notes" name="notes" rows={3} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Saving…' : 'Add task'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}