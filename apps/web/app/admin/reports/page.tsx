'use client'

import useSWR from 'swr'
import { BarChart3, TrendingUp, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { fetcher, type AdminOverview } from '@/lib/api'
import { formatNgn } from '@/lib/utils'

export default function AdminReportsPage() {
  const { data, isLoading } = useSWR<{ data: AdminOverview }>(
    '/admin/overview',
    fetcher,
    { revalidateOnFocus: false }
  )

  if (isLoading) return <PageSpinner />

  const overview = data?.data

  const summaryStats = [
    { label: 'Revenue this month', value: formatNgn(overview?.revenueMonth ?? 0), icon: TrendingUp },
    { label: 'Revenue today', value: formatNgn(overview?.revenueToday ?? 0), icon: TrendingUp },
    { label: 'Total customers', value: String(overview?.totalCustomers ?? 0), icon: BarChart3 },
    { label: 'Active bookings', value: String(overview?.activeBookings ?? 0), icon: BarChart3 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-navy">Reports</h1>
          <p className="text-sm text-navy/60">Summary metrics and exports</p>
        </div>
        <Button variant="ghost" size="sm">
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {summaryStats.map((s) => (
          <Card key={s.label} padding="sm">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} className="text-sky-accent" />
              <span className="text-xs text-navy/50">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-navy">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 size={18} className="text-sky-accent" />
          <h2 className="font-semibold text-navy">Revenue chart</h2>
        </div>
        <div className="h-48 flex items-center justify-center bg-navy/3 rounded-xl border border-navy/8">
          <p className="text-sm text-navy/40">Chart integration (Recharts/Chart.js) — connect to /admin/reports/revenue API</p>
        </div>
      </Card>
    </div>
  )
}
