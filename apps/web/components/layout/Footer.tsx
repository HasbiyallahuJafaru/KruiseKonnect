import Link from 'next/link'
import { Plane } from 'lucide-react'

const footerLinks = {
  Company: [
    { href: '/about', label: 'About us' },
    { href: '/safety', label: 'Safety' },
    { href: '/contact', label: 'Contact' },
  ],
  Flights: [
    { href: '/flights/search', label: 'Search flights' },
    { href: '/booking/retrieve', label: 'Retrieve booking' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy policy' },
    { href: '/terms', label: 'Terms of service' },
    { href: '/refund', label: 'Refund policy' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-navy text-white/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-accent">
                <Plane size={16} className="text-white -rotate-45" />
              </div>
              <span className="font-sora text-lg font-semibold text-white tracking-tight">
                KruiseKonnect
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-[200px]">
              Lagos&apos;s trusted aviation booking platform. Fly smarter.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-white mb-3">{group}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} KruiseKonnect. All rights reserved.
          </p>
          <p className="text-xs">Lagos, Nigeria &bull; Africa/Lagos (WAT)</p>
        </div>
      </div>
    </footer>
  )
}
