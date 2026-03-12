import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  Star,
  ArrowRight,
  Plane,
  MapPin,
} from 'lucide-react'
import { SearchWidget } from '@/components/ui/SearchWidget'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatNgn, formatDuration } from '@/lib/utils'
import { api, type FeaturedRoute } from '@/lib/api'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'KruiseKonnect — Book Lagos Flights',
  description:
    'Book charter and scheduled flights across Lagos and Nigeria. Fast, secure, and reliable.',
}

// Static featured routes as fallback (shown if API unavailable)
const STATIC_ROUTES: FeaturedRoute[] = [
  { id: '1', origin: 'Lagos', destination: 'Abuja', originCode: 'LOS', destinationCode: 'ABV', priceFrom: 85000, durationMinutes: 75 },
  { id: '2', origin: 'Lagos', destination: 'Port Harcourt', originCode: 'LOS', destinationCode: 'PHC', priceFrom: 65000, durationMinutes: 55 },
  { id: '3', origin: 'Lagos', destination: 'Kano', originCode: 'LOS', destinationCode: 'KAN', priceFrom: 110000, durationMinutes: 110 },
  { id: '4', origin: 'Lagos', destination: 'Enugu', originCode: 'LOS', destinationCode: 'ENU', priceFrom: 75000, durationMinutes: 65 },
]

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant confirmation',
    description: 'Booking confirmed in seconds. PDF receipt and itinerary delivered to your inbox immediately.',
  },
  {
    icon: Shield,
    title: 'Secure payments',
    description: 'All transactions secured via Paystack. We never store your card details.',
  },
  {
    icon: Clock,
    title: 'Real-time availability',
    description: 'Live seat counts. No double bookings, ever. Our system guarantees your seat.',
  },
  {
    icon: CheckCircle2,
    title: 'Paperless travel',
    description: 'Digital boarding ready. Download or re-print your itinerary anytime from your dashboard.',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Search a flight', body: 'Enter your origin, destination, date and passenger count.' },
  { step: '02', title: 'Pick your seat', body: 'Choose your preferred flight and enter passenger details.' },
  { step: '03', title: 'Pay securely', body: 'Complete payment via Paystack. Card, transfer, USSD — all accepted.' },
  { step: '04', title: 'Fly', body: 'Get your PDF itinerary, head to the airport, and take off.' },
]

const TESTIMONIALS = [
  { name: 'Adaeze O.', role: 'Business traveller', quote: 'Booked Lagos to Abuja in under 2 minutes. Smooth process, professional service.' },
  { name: 'Emeka N.', role: 'Regular flyer', quote: 'The dashboard makes it easy to track all my trips. KruiseKonnect is my go-to now.' },
  { name: 'Fatima B.', role: 'Corporate client', quote: 'We book for our entire team through KruiseKonnect. Reliable and always on schedule.' },
]

async function getFeaturedRoutes(): Promise<FeaturedRoute[]> {
  try {
    const res = await api.flights.getFeaturedRoutes()
    return res.data
  } catch {
    return STATIC_ROUTES
  }
}

export default async function HomePage() {
  const featuredRoutes = await getFeaturedRoutes()

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 mb-6">
              <Plane size={12} className="-rotate-45 text-sky-accent" />
              Lagos Aviation Booking
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-5">
              Book Nigerian flights
              <br />
              <span className="text-sky-accent">without the hassle</span>
            </h1>
            <p className="text-lg text-white/70 text-balance max-w-xl mx-auto">
              Scheduled and charter flights across Nigeria. Search, book, pay, and fly —
              all in one place.
            </p>
          </div>

          {/* Search widget */}
          <div className="max-w-4xl mx-auto">
            <SearchWidget />
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-chalk">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy">Why KruiseKonnect?</h2>
            <p className="mt-2 text-navy/60">Built for serious Nigerian travellers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <Card key={f.title} hover>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-pale mb-4">
                  <f.icon size={20} className="text-sky-accent" />
                </div>
                <h3 className="font-semibold text-navy mb-1.5">{f.title}</h3>
                <p className="text-sm text-navy/60 leading-relaxed">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Routes ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-navy">Popular routes</h2>
              <p className="mt-1 text-navy/60">Most booked flights from Lagos</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/flights/search" className="flex items-center gap-1.5">
                View all <ArrowRight size={14} />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredRoutes.map((route) => (
              <Link
                key={route.id}
                href={`/flights/search?origin=${route.originCode}&destination=${route.destinationCode}`}
                className="group"
              >
                <Card hover className="h-full transition-all group-hover:border-sky-accent/30">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 group-hover:bg-sky-pale transition-colors">
                      <Plane size={16} className="text-navy -rotate-45 group-hover:text-sky-accent transition-colors" />
                    </div>
                    <span className="text-xs text-navy/40">{formatDuration(route.durationMinutes)}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-navy">{route.originCode}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="h-px flex-1 bg-navy/15" />
                      <ArrowRight size={10} className="text-navy/30 shrink-0" />
                      <div className="h-px flex-1 bg-navy/15" />
                    </div>
                    <span className="text-lg font-bold text-navy">{route.destinationCode}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-navy/50 mb-3">
                    <MapPin size={10} />
                    {route.origin} → {route.destination}
                  </div>

                  <p className="text-sm font-semibold text-sky-accent">
                    From {formatNgn(route.priceFrom)}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-chalk">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy">How it works</h2>
            <p className="mt-2 text-navy/60">Four steps from search to sky</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-navy/10 z-0" />
                )}
                <div className="relative z-10">
                  <div className="text-4xl font-bold text-sky-accent/20 font-sora mb-3">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-navy mb-1.5">{step.title}</h3>
                  <p className="text-sm text-navy/60 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy">Trusted by Nigerian travellers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-navy/70 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-navy">{t.name}</p>
                  <p className="text-xs text-navy/50">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-navy text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <Plane size={32} className="-rotate-45 text-sky-accent mx-auto mb-5" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to take off?
          </h2>
          <p className="text-white/70 mb-8 text-balance">
            Join thousands of travellers who book smarter with KruiseKonnect.
            Your next flight is a few clicks away.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/flights/search">Search flights</Link>
            </Button>
            <Button size="lg" variant="ghost" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/signup">Create free account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
