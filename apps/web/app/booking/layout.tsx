import Link from 'next/link'
import { Plane } from 'lucide-react'

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-chalk">
      <header className="border-b border-navy/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy">
              <Plane size={14} className="text-white -rotate-45" />
            </div>
            <span className="font-sora text-base font-semibold text-navy">
              Kruise<span className="text-sky-accent">Konnect</span>
            </span>
          </Link>
          <span className="text-xs text-navy/40">Secure booking</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
