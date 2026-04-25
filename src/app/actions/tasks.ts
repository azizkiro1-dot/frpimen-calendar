'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = formData.get('title')?.toString().trim()
  if (!title) return { error: 'Title required' }

  const due_at = formData.get('due_at')?.toString()
  const priority = formData.get('priority')?.toString() || 'normal'
  const notes = formData.get('notes')?.toString() || null

  const { error } = await supabase.from('tasks').insert({
    owner_id: user.id,
    title,
    notes,
    due_at: due_at ? new Date(due_at).toISOString() : null,
    priority,
    status: 'open',
  })

  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function toggleTask(id: string, currentStatus: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const newStatus = currentStatus === 'done' ? 'open' : 'done'
  const { error } = await supabase
    .from('tasks')
    .update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function updatePriority(id: string, priority: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('tasks')
    .update({ priority })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}