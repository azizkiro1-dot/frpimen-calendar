import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChatInterface } from '@/components/chat-interface'
import { Calendar, CheckSquare, Users, MessageSquare, LogOut } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(40)

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar userName={profile?.full_name ?? user.email ?? ""} userEmail={user.email ?? ""} />
      <div className="md:pl-64 transition-[padding] duration-200">
      <main className="max-w-4xl mx-auto px-4 py-6">
        <ChatInterface
          initialMessages={(history ?? []) as any}
          userName={profile?.full_name ?? user.email ?? 'friend'}
        />
      </main>
      </div>
    </div>
  )
}
