'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Calendar, CheckSquare, MessageSquare, Users, LayoutDashboard, Upload, LogOut, Menu } from 'lucide-react'

type NavItem = { href: string; label: string; icon: any }

const nav: NavItem[] = [
  { href: '/', label: 'Calendar', icon: Calendar },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/sharing', label: 'Sharing', icon: Users },
  { href: '/import', label: 'Import', icon: Upload },
]

type Props = {
  userName: string
  userEmail: string
}

export function AppHeader({ userName, userEmail }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="border-b bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="px-6 py-5 border-b">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Fr. Pimen</p>
                    <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  </div>
                </div>
              </div>
              <nav className="p-3 space-y-1">
                {nav.map(item => {
                  const Icon = item.icon
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${isActive(item.href) ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                    </Link>
                  )
                })}
              </nav>
              <div className="px-3 pb-4 mt-4 border-t pt-4">
                <form action="/auth/logout" method="post">
                  <Button variant="ghost" size="sm" type="submit" className="w-full justify-start text-slate-600">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold truncate">Fr. Pimen Calendar</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-0.5">
          {nav.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <Button variant={active ? 'secondary' : 'ghost'} size="sm">
                  <Icon className="h-4 w-4 mr-2" /> {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 hidden lg:inline truncate max-w-[160px]">{userName}</span>
          <form action="/auth/logout" method="post" className="hidden md:block">
            <Button variant="outline" size="sm" type="submit">
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden lg:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
