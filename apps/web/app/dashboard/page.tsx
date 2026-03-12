'use client'

import Link from 'next/link'
import { Ticket, Plane, ArrowRight } from 'lucide-react'
import useSWR from 'swr'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { fetcher, type Booking } from '@/lib/api'
import { formatNgn, formatDate, getStatusColour } from '@/lib/utils'

export default function DashboardPage() {
  const { data, isLoading } = useSWR<{ data: Booking[]; meta: { total: number } }>(
    '/bookings/my?limit=3',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  if (isLoading) return <PageSpinner />

  const recentBookings = data?.data ?? []
  const totalBookings = data?.meta?.total ?? 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy">Dashboard</h1>
        <p className="text-sm text-navy/60 mt-0.5">Welcome back. Manage your bookings and travel documents.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-1">
            <Ticket size={14} className="text-sky-accent" />
            <span className="text-xs text-navy/50">Total bookings</span>
          </div>
          <p className="text-2xl font-bold text-navy">{totalBookings}</p>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-1">
            <Plane size={14} className="text-sky-accent -rotate-45" />
            <span className="text-xs text-navy/50">Recent</span>
          </div>
          <p className="text-2xl font-bold text-navy">{recentBookings.length}</p>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy">Recent bookings</h2>
          {totalBookings > 3 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/bookings" className="flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </Button>
          )}
        </div>

        {recentBookings.length === 0 ? (
          <EmptyState
            icon={<Plane size={20} />}
            title="No bookings yet"
            description="Search for a flight and make your first booking."
            action={{ label: 'Search flights', onClick: () => window.location.href = '/flights/search' }}
          />
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-navy/8 hover:border-sky-accent/20 hover:bg-sky-pale/30 transition-all"
              >
                <div>
                  <p className="text-sm font-semibold font-mono text-navy">{booking.reference}</p>
                  <p className="text-xs text-navy/50">{formatDate(booking.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-navy hidden sm:block">
                    {formatNgn(booking.totalNgn)}
                  </span>
                  <Badge color={getStatusColour(booking.status)}>
                    {booking.status}
                  </Badge>
                  <ArrowRight size={12} className="text-navy/30" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Quick action */}
      <div className="mt-5">
        <Button asChild>
          <Link href="/flights/search" className="flex items-center gap-2">
            <Plane size={14} className="-rotate-45" />
            Book a new flight
          </Link>
        </Button>
      </div>
    </div>
  )
}
