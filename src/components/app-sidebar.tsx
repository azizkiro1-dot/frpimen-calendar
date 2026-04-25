'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
  Calendar, CheckSquare, MessageSquare, Users, LayoutDashboard,
  Upload, LogOut, Menu, ChevronLeft, ChevronRight,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: any; tone: string }

const nav: NavItem[] = [
  { href: '/',          label: 'Calendar',  icon: Calendar,        tone: '#f59e0b' },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tone: '#3b82f6' },
  { href: '/tasks',     label: 'Tasks',     icon: CheckSquare,     tone: '#10b981' },
  { href: '/chat',      label: 'Chat',      icon: MessageSquare,   tone: '#8b5cf6' },
  { href: '/rsvp',      label: 'Invites',  icon: Calendar,        tone: '#f97316' },
  { href: '/sharing',   label: 'Sharing',   icon: Users,           tone: '#ec4899' },
  { href: '/import',    label: 'Import',    icon: Upload,          tone: '#06b6d4' },
]

type Props = { userName: string; userEmail: string }

export function AppSidebar({ userName, userEmail }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {nav.map(item => {
        const Icon = item.icon
        const active = isActive(item.href)
        return (
          <Link key={item.href} href={item.href} onClick={onClick}>
            <motion.div
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition relative
              ${active ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${active ? 'bg-white' : ''}`}
                style={{ background: active ? '#fff' : item.tone }}
              />
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-900'}`} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </motion.div>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 bg-white border-r border-neutral-200 transition-all duration-200
        ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        <div className="px-4 py-4 border-b border-neutral-100 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">Fr. Pimen</p>
              <p className="text-[11px] text-neutral-500 truncate">{userEmail}</p>
            </div>
          )}
        </div>
        <NavList />
        <div className="p-3 border-t border-neutral-100 space-y-2">
          {!collapsed && (
            <div className="px-3 py-2 text-xs text-neutral-500 truncate">{userName}</div>
          )}
          <form action="/auth/logout" method="post">
            <Button
              variant="ghost" type="submit" size="sm"
              className={`w-full justify-${collapsed ? 'center' : 'start'} text-neutral-600 hover:text-neutral-900 rounded-xl`}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sign out</span>}
            </Button>
          </form>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full h-8 rounded-xl border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center text-neutral-500"
            aria-label="Collapse sidebar"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden border-b bg-white sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="px-6 py-5 border-b">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Fr. Pimen</p>
                    <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
                  </div>
                </div>
              </div>
              <NavList onClick={() => setOpen(false)} />
              <div className="px-3 pb-4 mt-2 border-t pt-3">
                <form action="/auth/logout" method="post">
                  <Button variant="ghost" size="sm" type="submit" className="w-full justify-start text-neutral-600">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center shrink-0">
              <Calendar className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-[15px] truncate">Fr. Pimen</span>
          </Link>
          <span className="w-9" />
        </div>
      </header>
    </>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:pl-64 transition-[padding] duration-200">
      {children}
    </div>
  )
}
