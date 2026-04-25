import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChatInterface } from '@/components/chat-interface'
import { Calendar, CheckSquare, Users, MessageSquare, LogOut } from 'lucide-react'

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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Fr. Pimen Calendar</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/"><Button variant="ghost" size="sm"><Calendar className="h-4 w-4 mr-2"/>Calendar</Button></Link>
            <Link href="/tasks"><Button variant="ghost" size="sm"><CheckSquare className="h-4 w-4 mr-2"/>Tasks</Button></Link>
            <Link href="/chat"><Button variant="secondary" size="sm"><MessageSquare className="h-4 w-4 mr-2"/>Chat</Button></Link>
            <Link href="/sharing"><Button variant="ghost" size="sm"><Users className="h-4 w-4 mr-2"/>Sharing</Button></Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:inline">{profile?.full_name ?? user.email}</span>
            <form action="/auth/logout" method="post">
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <ChatInterface
          initialMessages={(history ?? []) as any}
          userName={profile?.full_name ?? user.email ?? 'friend'}
        />
      </main>
    </div>
  )
}
