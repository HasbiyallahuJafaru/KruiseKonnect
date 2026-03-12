import Link from 'next/link'
import { Plane, LayoutDashboard, Ticket, User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/bookings', label: 'My bookings', icon: Ticket },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login?redirect=/dashboard')

  const user = session.user

  return (
    <div className="min-h-screen bg-chalk">
      {/* Top bar */}
      <header className="border-b border-navy/8 bg-white sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-navy flex items-center justify-center">
              <Plane size={13} className="text-white -rotate-45" />
            </div>
            <span className="font-sora text-sm font-semibold text-navy hidden sm:block">
              Kruise<span className="text-sky-accent">Konnect</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-navy/60 hidden sm:block">
              {user.user_metadata?.full_name ?? user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-navy/50 hover:text-navy transition-colors"
                aria-label="Sign out"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:flex flex-col w-52 shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy/70 hover:bg-navy/5 hover:text-navy transition-colors"
                >
                  <item.icon size={15} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Mobile tab bar */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-navy/8 bg-white z-50 flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs text-navy/60 hover:text-sky-accent transition-colors"
              >
                <item.icon size={18} />
                {item.label.split(' ')[0]}
              </Link>
            ))}
          </nav>

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
