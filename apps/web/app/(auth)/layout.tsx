import Link from 'next/link'
import { Plane } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-chalk flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-navy/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy">
              <Plane size={14} className="text-white -rotate-45" />
            </div>
            <span className="font-sora text-base font-semibold text-navy tracking-tight">
              Kruise<span className="text-sky-accent">Konnect</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-navy/40 border-t border-navy/8">
        &copy; {new Date().getFullYear()} KruiseKonnect
      </footer>
    </div>
  )
}
