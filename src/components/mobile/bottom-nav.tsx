'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, CheckSquare, MessageSquare, LayoutDashboard, Users } from 'lucide-react'

const tabs = [
  { href: '/', label: 'Calendar', icon: Calendar },
  { href: '/dashboard', label: 'Stats', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/sharing', label: 'Share', icon: Users },
]

export function BottomNav() {
  const path = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-neutral-200 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map(t => {
          const active = t.href === '/' ? path === '/' : path?.startsWith(t.href)
          const Icon = t.icon
          return (
            <Link key={t.href} href={t.href} className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition">
              <Icon className={`h-5 w-5 ${active ? 'text-neutral-900' : 'text-neutral-400'}`} />
              <span className={`text-[10px] mt-0.5 ${active ? 'text-neutral-900 font-semibold' : 'text-neutral-500'}`}>{t.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
