'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Plane } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const navLinks = [
  { href: '/flights/search', label: 'Book a Flight' },
  { href: '/booking/retrieve', label: 'My Booking' },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-navy/8 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy">
              <Plane size={16} className="text-white -rotate-45" />
            </div>
            <span className="font-sora text-lg font-bold text-navy tracking-tight">
              Kruise<span className="text-sky-accent">Konnect</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-sky-accent',
                  pathname === link.href ? 'text-sky-accent' : 'text-navy/70'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-navy/70 hover:text-navy hover:bg-navy/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-navy/8 bg-white px-4 pb-4 pt-3">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-sky-pale text-sky-accent'
                    : 'text-navy/70 hover:bg-navy/5 hover:text-navy'
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-navy/8">
              <Button variant="ghost" asChild>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  Get started
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
