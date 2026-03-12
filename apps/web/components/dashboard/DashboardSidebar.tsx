'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Plane,
  LayoutDashboard,
  Ticket,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',          label: 'Overview',     icon: LayoutDashboard, exact: true },
  { href: '/dashboard/bookings', label: 'My Bookings',  icon: Ticket           },
  { href: '/dashboard/profile',  label: 'Profile',      icon: User             },
]

interface DashboardSidebarProps {
  userName: string
  userEmail: string
  userInitial: string
}

export function DashboardSidebar({ userName, userEmail, userInitial }: DashboardSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 sticky top-0 h-screen border-r border-navy/8 bg-white">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-navy/8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-navy flex items-center justify-center shadow-sm">
              <Plane size={14} className="text-white -rotate-45" />
            </div>
            <span className="font-sora text-[15px] font-bold text-navy tracking-tight">
              Kruise<span className="text-sky-accent">Konnect</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold text-navy/35 uppercase tracking-widest mb-3">
            Menu
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-sky-pale text-sky-accent'
                    : 'text-navy/55 hover:bg-navy/5 hover:text-navy'
                )}
              >
                <item.icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <ChevronRight size={13} className="opacity-40" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-navy/8">
          <div className="flex items-center gap-3 rounded-xl p-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-accent to-navy-700 flex items-center justify-center text-white text-[13px] font-bold shrink-0 shadow-sm">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-navy truncate leading-snug">{userName}</p>
              <p className="text-[11px] text-navy/45 truncate">{userEmail}</p>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-navy/30 hover:text-navy/70 transition-colors p-1.5 rounded-lg hover:bg-navy/5"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-14 bg-white border-b border-navy/8 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-navy flex items-center justify-center">
            <Plane size={12} className="text-white -rotate-45" />
          </div>
          <span className="font-sora text-sm font-bold text-navy">
            Kruise<span className="text-sky-accent">Konnect</span>
          </span>
        </Link>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-accent to-navy flex items-center justify-center text-white text-xs font-bold">
          {userInitial}
        </div>
      </header>

      {/* ── Mobile bottom tab bar ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-navy/8 flex">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-sky-accent' : 'text-navy/45 hover:text-navy'
              )}
            >
              <item.icon size={19} strokeWidth={active ? 2.2 : 1.7} />
              {item.label.split(' ')[0]}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
