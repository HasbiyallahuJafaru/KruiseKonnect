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
  Users,
  Award,
} from 'lucide-react'
import { SearchWidget } from '@/components/ui/SearchWidget'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PopularRouteCard } from '@/components/ui/PopularRouteCard'
import { formatNgn } from '@/lib/utils'
import { MOCK_FEATURED_ROUTES } from '@/lib/mock-data'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'KruiseKonnect — Book Lagos Flights',
  description:
    'Book charter and scheduled flights across Lagos and Nigeria. Fast, secure, and reliable.',
}

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

const STATS = [
  { icon: Users, value: '12,000+', label: 'Passengers flown' },
  { icon: Plane, value: '400+', label: 'Flights operated' },
  { icon: Award, value: '98%', label: 'On-time rate' },
]

export default function HomePage() {
  const featuredRoutes = MOCK_FEATURED_ROUTES

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1A2E 0%, #162240 40%, #1a2d5a 70%, #0d2055 100%)' }}>
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-10 lg:pt-24">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/80 mb-6 backdrop-blur-sm">
              <Plane size={12} className="-rotate-45 text-sky-accent" />
              Nigeria&apos;s fastest aviation booking
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-5 leading-tight">
              Book Nigerian flights
              <br />
              <span className="text-sky-accent">without the hassle</span>
            </h1>
            <p className="text-lg text-white/65 text-balance max-w-xl mx-auto leading-relaxed">
              Scheduled and charter flights across Nigeria. Search, book, pay, and fly —
              all in one place.
            </p>
          </div>

          {/* Search widget */}
          <div className="max-w-4xl mx-auto">
            <SearchWidget />
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              {STATS.map((s) => (
                <div key={s.label} className="py-5 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-white font-sora">{s.value}</p>
                  <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-chalk">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-sky-accent uppercase tracking-widest mb-2">Why us</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy">Built for serious Nigerian travellers</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <Card key={f.title} hover className="group">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-pale mb-4 group-hover:bg-sky-accent/10 transition-colors">
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
              <p className="text-xs font-semibold text-sky-accent uppercase tracking-widest mb-1">Routes</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-navy">Popular routes</h2>
              <p className="mt-1 text-navy/60 text-sm">Most booked flights from Lagos</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/flights/search" className="flex items-center gap-1.5">
                View all <ArrowRight size={14} />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredRoutes.map((route) => (
              <PopularRouteCard key={route.id} route={route} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-chalk">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-sky-accent uppercase tracking-widest mb-2">Process</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy">Four steps from search to sky</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-navy/8 z-0" />
                )}
                <div className="relative z-10">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 mb-4">
                    <span className="text-sm font-bold text-sky-accent font-sora">{step.step}</span>
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
            <p className="text-xs font-semibold text-sky-accent uppercase tracking-widest mb-2">Reviews</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy">Trusted by Nigerian travellers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} hover>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-navy/70 leading-relaxed mb-5 flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-2.5 pt-4 border-t border-navy/6">
                  <div className="h-8 w-8 rounded-full bg-sky-pale flex items-center justify-center text-xs font-bold text-sky-accent">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy leading-none">{t.name}</p>
                    <p className="text-xs text-navy/50 mt-0.5">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-24 text-white" style={{ background: 'linear-gradient(135deg, #0F1A2E 0%, #162240 50%, #0d2055 100%)' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-accent/15 mb-6 mx-auto">
            <Plane size={26} className="-rotate-45 text-sky-accent" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to take off?
          </h2>
          <p className="text-white/65 mb-10 text-balance text-lg leading-relaxed">
            Join thousands of travellers who book smarter with KruiseKonnect.
            Your next flight is a few clicks away.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/flights/search">Search flights</Link>
            </Button>
            <Button size="lg" className="border border-white/20 bg-white/10 text-white hover:bg-white/20" asChild>
              <Link href="/signup">Create free account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

