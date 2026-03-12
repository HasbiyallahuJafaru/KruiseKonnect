'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AdminTable } from '@/components/admin/AdminTable'
import { Badge } from '@/components/ui/Badge'
import { fetcher, type Booking } from '@/lib/api'
import { formatNgn, formatDate, getStatusColour } from '@/lib/utils'

export default function AdminBookingsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR<{ data: Booking[]; meta: { totalPages: number; total: number } }>(
    `/admin/bookings?page=${page}&limit=20`,
    fetcher,
    { revalidateOnFocus: true }
  )

  return (
    <AdminTable
      title="Bookings"
      data={data?.data}
      isLoading={isLoading}
      totalPages={data?.meta?.totalPages}
      page={page}
      onPageChange={setPage}
      columns={[
        {
          key: 'reference',
          header: 'Reference',
          render: (b) => <span className="font-mono font-semibold text-navy">{b.reference}</span>,
        },
        {
          key: 'route',
          header: 'Route',
          render: (b) => b.flight
            ? <span className="text-navy/70">{b.flight.route.originCode} → {b.flight.route.destinationCode}</span>
            : <span className="text-navy/30">—</span>,
        },
        {
          key: 'passengers',
          header: 'Pax',
          render: (b) => <span className="text-navy">{b.passengers.length}</span>,
        },
        {
          key: 'amount',
          header: 'Amount',
          render: (b) => <span className="font-medium text-navy">{formatNgn(b.totalNgn)}</span>,
        },
        {
          key: 'status',
          header: 'Status',
          render: (b) => <Badge color={getStatusColour(b.status)}>{b.status}</Badge>,
        },
        {
          key: 'date',
          header: 'Date',
          render: (b) => <span className="text-navy/50">{formatDate(b.createdAt)}</span>,
        },
      ]}
    />
  )
}
