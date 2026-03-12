'use client'

import Link from 'next/link'
import {
  Ticket,
  Plane,
  ArrowRight,
  Clock,
  TrendingUp,
  Plus,
  ChevronRight,
} from 'lucide-react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { fetcher, type Booking } from '@/lib/api'
import {
  cn,
  formatNgn,
  formatDate,
  formatTime,
  formatDuration,
  getStatusColour,
} from '@/lib/utils'

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  iconClass: string
  iconBg: string
  accent?: string
}

function StatCard({ label, value, icon: Icon, iconClass, iconBg, accent }: StatCardProps) {
  return (
    <div className={cn('rounded-2xl bg-white border border-navy/8 shadow-card p-5', accent)}>
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-4', iconBg)}>
        <Icon size={16} className={iconClass} strokeWidth={2} />
      </div>
      <p className="text-3xl font-bold text-navy font-sora tracking-tight leading-none">{value}</p>
      <p className="text-[11px] text-navy/45 font-medium mt-2 uppercase tracking-wide">{label}</p>
    </div>
  )
}

// ─── Next flight card ─────────────────────────────────────────────────────────

function NextFlightCard({ booking }: { booking: Booking }) {
  const { flight } = booking
  if (!flight) return null

  return (
    <Link href={`/dashboard/bookings/${booking.id}`} className="block group">
      <div className="rounded-2xl bg-navy p-5 text-white relative overflow-hidden">
        {/* Subtle radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{ background: 'radial-gradient(ellipse at 85% 15%, #60a5fa 0%, transparent 55%)' }}
        />

        <div className="relative">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold text-white/45 uppercase tracking-widest">
                Next Flight
              </p>
              <p className="text-xs text-white/60 mt-0.5">{formatDate(flight.departureAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/40">{booking.reference}</span>
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                confirmed
              </span>
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-4">
            <div className="text-center min-w-0">
              <p className="text-2xl font-bold font-sora">{flight.route.originCode}</p>
              <p className="text-[11px] text-white/45 mt-0.5 truncate">{flight.route.origin}</p>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1.5">
              <p className="text-[10px] text-white/35">{formatDuration(flight.durationMinutes)}</p>
              <div className="w-full flex items-center gap-1.5">
                <div className="h-px flex-1 bg-white/15 rounded-full" />
                <Plane size={11} className="text-sky-light shrink-0" />
                <div className="h-px flex-1 bg-white/15 rounded-full" />
              </div>
              <p className="text-[10px] text-white/35">
                {booking.passengers.length} pax
              </p>
            </div>

            <div className="text-center min-w-0">
              <p className="text-2xl font-bold font-sora">{flight.route.destinationCode}</p>
              <p className="text-[11px] text-white/45 mt-0.5 truncate">{flight.route.destination}</p>
            </div>
          </div>

          {/* Times footer */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center gap-5">
              <div>
                <p className="text-[10px] text-white/35">Departs</p>
                <p className="text-sm font-semibold mt-0.5">{formatTime(flight.departureAt)}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/35">Arrives</p>
                <p className="text-sm font-semibold mt-0.5">{formatTime(flight.arrivalAt)}</p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-white/30 group-hover:text-white/60 transition-colors"
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-navy/8 bg-white p-5">
            <Skeleton className="h-9 w-9 rounded-xl mb-4" />
            <Skeleton className="h-8 w-10 mb-2" />
            <Skeleton className="h-2.5 w-20 rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-44 rounded-2xl" />
      <div className="rounded-2xl border border-navy/8 bg-white p-5 space-y-2">
        <Skeleton className="h-4 w-32 mb-3" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[62px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading } = useSWR<{ data: Booking[]; meta: { total: number } }>(
    '/bookings/my?limit=5',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  if (isLoading) return <DashboardSkeleton />

  const bookings      = data?.data ?? []
  const totalBookings = data?.meta?.total ?? 0
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length
  const pendingCount   = bookings.filter((b) => b.status === 'pending').length

  // Nearest confirmed future flight
  const now = new Date()
  const nextFlight = bookings.find(
    (b) => b.status === 'confirmed' && b.flight && new Date(b.flight.departureAt) > now
  )

  const recentBookings = bookings.slice(0, 3)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy font-sora leading-tight">Overview</h1>
        <p className="text-sm text-navy/50 mt-0.5">
          Track your flights and manage your travel documents.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total"
          value={totalBookings}
          icon={Ticket}
          iconBg="bg-sky-pale"
          iconClass="text-sky-accent"
        />
        <StatCard
          label="Confirmed"
          value={confirmedCount}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconClass="text-emerald-600"
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          icon={Clock}
          iconBg="bg-amber-50"
          iconClass="text-amber-500"
        />
      </div>

      {/* ── Next flight ── */}
      {nextFlight && <NextFlightCard booking={nextFlight} />}

      {/* ── Recent bookings ── */}
      <div className="rounded-2xl border border-navy/8 bg-white shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-navy/6">
          <h2 className="text-sm font-semibold text-navy">Recent bookings</h2>
          {totalBookings > 3 && (
            <Link
              href="/dashboard/bookings"
              className="text-xs text-sky-accent hover:underline font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </Link>
          )}
        </div>

        {recentBookings.length === 0 ? (
          <div className="px-5 py-6">
            <EmptyState
              icon={<Plane size={20} />}
              title="No bookings yet"
              description="Search for a flight and make your first booking."
              action={{
                label: 'Search flights',
                onClick: () => { window.location.href = '/flights/search' },
              }}
            />
          </div>
        ) : (
          <div className="divide-y divide-navy/5">
            {recentBookings.map((booking) => {
              const { flight } = booking
              return (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-chalk transition-colors group"
                >
                  {/* Icon */}
                  <div className="h-9 w-9 rounded-xl bg-sky-pale flex items-center justify-center shrink-0">
                    <Plane size={14} className="text-sky-accent -rotate-45" />
                  </div>

                  {/* Route / reference */}
                  <div className="flex-1 min-w-0">
                    {flight ? (
                      <>
                        <p className="text-sm font-semibold text-navy">
                          {flight.route.originCode} → {flight.route.destinationCode}
                        </p>
                        <p className="text-xs text-navy/45 mt-0.5">
                          {formatDate(flight.departureAt)}
                          {' · '}
                          {booking.passengers.length} pax
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold font-mono text-navy tracking-wide">
                          {booking.reference}
                        </p>
                        <p className="text-xs text-navy/45 mt-0.5">{formatDate(booking.createdAt)}</p>
                      </>
                    )}
                  </div>

                  {/* Amount + status */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-sm font-semibold text-navy">
                      {formatNgn(booking.totalNgn)}
                    </span>
                    <Badge color={getStatusColour(booking.status)}>{booking.status}</Badge>
                  </div>

                  <ChevronRight
                    size={14}
                    className="text-navy/20 group-hover:text-navy/50 transition-colors shrink-0"
                  />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild size="lg" className="rounded-xl">
          <Link href="/flights/search">
            <Plus size={15} />
            Book a flight
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-xl">
          <Link href="/dashboard/bookings">
            <Ticket size={15} />
            All bookings
          </Link>
        </Button>
      </div>

    </div>
  )
}
