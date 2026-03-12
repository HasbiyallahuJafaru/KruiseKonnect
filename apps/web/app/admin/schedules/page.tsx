'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AdminTable } from '@/components/admin/AdminTable'
import { Badge } from '@/components/ui/Badge'
import { fetcher, type FlightSchedule } from '@/lib/api'
import { formatDateTime, formatNgn, formatDuration } from '@/lib/utils'

export default function AdminSchedulesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR<{ data: FlightSchedule[]; meta: { totalPages: number } }>(
    `/admin/schedules?page=${page}&limit=20`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <AdminTable
      title="Schedules"
      data={data?.data}
      isLoading={isLoading}
      totalPages={data?.meta?.totalPages}
      page={page}
      onPageChange={setPage}
      columns={[
        {
          key: 'route',
          header: 'Route',
          render: (s) => (
            <span className="font-mono font-semibold text-navy">
              {s.route.originCode} → {s.route.destinationCode}
            </span>
          ),
        },
        {
          key: 'departure',
          header: 'Departure',
          render: (s) => <span className="text-navy/70">{formatDateTime(s.departureAt)}</span>,
        },
        {
          key: 'duration',
          header: 'Duration',
          render: (s) => <span className="text-navy/60">{formatDuration(s.durationMinutes)}</span>,
        },
        {
          key: 'aircraft',
          header: 'Aircraft',
          render: (s) => <span className="text-navy/70">{s.aircraft.name}</span>,
        },
        {
          key: 'seats',
          header: 'Seats avail.',
          render: (s) => (
            <Badge color={s.seatsAvailable <= 3 ? 'red' : s.seatsAvailable <= 10 ? 'yellow' : 'green'}>
              {s.seatsAvailable}
            </Badge>
          ),
        },
        {
          key: 'price',
          header: 'Price',
          render: (s) => <span className="font-medium text-navy">{formatNgn(s.priceNgn)}</span>,
        },
      ]}
    />
  )
}
