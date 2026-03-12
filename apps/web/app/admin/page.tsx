'use client'

import { Ticket, TrendingUp, Users, Clock, ArrowRight, Plane } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { fetcher, type AdminOverview } from '@/lib/api'
import { formatNgn, formatDate, getStatusColour } from '@/lib/utils'

export default function AdminOverviewPage() {
  const { data, isLoading } = useSWR<{ data: AdminOverview }>(
    '/admin/overview',
    fetcher,
    { refreshInterval: 120_000, revalidateOnFocus: true }
  )

  if (isLoading) return <PageSpinner />

  const overview = data?.data

  const stats = [
    { label: 'Bookings today', value: overview?.bookingsToday ?? 0, icon: Ticket, color: 'text-sky-accent' },
    { label: 'Revenue today', value: formatNgn(overview?.revenueToday ?? 0), icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Revenue (month)', value: formatNgn(overview?.revenueMonth ?? 0), icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Active bookings', value: overview?.activeBookings ?? 0, icon: Plane, color: 'text-navy' },
    { label: 'Pending payments', value: overview?.pendingPayments ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Total customers', value: overview?.totalCustomers ?? 0, icon: Users, color: 'text-purple-500' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy">Overview</h1>
        <p className="text-sm text-navy/60">Live stats — refreshes every 2 minutes</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} padding="sm">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={14} className={stat.color} />
              <span className="text-xs text-navy/50">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-navy">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy">Recent bookings</h2>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-1 text-xs text-sky-accent hover:underline"
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>

        {!overview?.recentBookings?.length ? (
          <p className="text-sm text-navy/50 py-4 text-center">No bookings yet today</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/8 text-left">
                  <th className="pb-3 pr-4 text-xs font-medium text-navy/50">Reference</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-navy/50">Date</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-navy/50">Amount</th>
                  <th className="pb-3 text-xs font-medium text-navy/50">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {overview.recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 pr-4 font-mono font-semibold text-navy">{b.reference}</td>
                    <td className="py-3 pr-4 text-navy/60">{formatDate(b.createdAt)}</td>
                    <td className="py-3 pr-4 font-medium text-navy">{formatNgn(b.totalNgn)}</td>
                    <td className="py-3">
                      <Badge color={getStatusColour(b.status)}>{b.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
