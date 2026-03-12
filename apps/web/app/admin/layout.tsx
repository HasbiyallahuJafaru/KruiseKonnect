import Link from 'next/link'
import {
  Plane,
  LayoutDashboard,
  Ticket,
  CreditCard,
  Users,
  Map,
  Calendar,
  PlaneTakeoff,
  FileText,
  Mail,
  BarChart3,
  UserCog,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: Ticket },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/routes', label: 'Routes', icon: Map },
  { href: '/admin/schedules', label: 'Schedules', icon: Calendar },
  { href: '/admin/aircraft', label: 'Aircraft', icon: PlaneTakeoff },
  { href: '/admin/documents', label: 'Documents', icon: FileText },
  { href: '/admin/emails', label: 'Emails', icon: Mail },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: UserCog },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.app_metadata?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-chalk flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-navy text-white shrink-0 fixed top-0 left-0 h-full overflow-y-auto">
        <div className="px-4 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sky-accent flex items-center justify-center">
              <Plane size={13} className="text-white -rotate-45" />
            </div>
            <span className="font-sora text-sm font-semibold">
              KruiseKonnect
            </span>
          </Link>
          <p className="text-xs text-white/40 mt-0.5 ml-9">Admin</p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-navy text-white h-14 border-b border-white/10 flex items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <Plane size={14} className="text-sky-accent -rotate-45" />
          <span className="font-sora text-sm font-semibold">KruiseKonnect Admin</span>
        </Link>
      </div>

      {/* Main */}
      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
