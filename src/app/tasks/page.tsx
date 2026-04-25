import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, LogOut, CheckSquare, MessageSquare, LayoutDashboard, Users } from 'lucide-react'
import { TasksList } from '@/components/tasks-list'
import { AppHeader } from '@/components/app-header'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('owner_id', user.id)
    .order('status')
    .order('due_at', { ascending: true, nullsFirst: false })

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader userName={profile?.full_name ?? user.email ?? ""} userEmail={user.email ?? ""} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <TasksList tasks={tasks ?? []} />
      </main>
    </div>
  )
}