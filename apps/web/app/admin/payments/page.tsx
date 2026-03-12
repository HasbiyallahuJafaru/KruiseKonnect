'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AdminTable } from '@/components/admin/AdminTable'
import { Badge } from '@/components/ui/Badge'
import { fetcher, type Payment } from '@/lib/api'
import { formatNgn, formatDate, getStatusColour } from '@/lib/utils'

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR<{ data: Payment[]; meta: { totalPages: number } }>(
    `/admin/payments?page=${page}&limit=20`,
    fetcher,
    { revalidateOnFocus: true }
  )

  return (
    <AdminTable
      title="Payments"
      data={data?.data}
      isLoading={isLoading}
      totalPages={data?.meta?.totalPages}
      page={page}
      onPageChange={setPage}
      columns={[
        {
          key: 'reference',
          header: 'Reference',
          render: (p) => <span className="font-mono font-semibold text-navy">{p.reference}</span>,
        },
        {
          key: 'booking',
          header: 'Booking',
          render: (p) => p.booking
            ? <span className="font-mono text-navy/70">{p.booking.reference}</span>
            : <span className="text-navy/30">—</span>,
        },
        {
          key: 'amount',
          header: 'Amount',
          render: (p) => <span className="font-medium text-navy">{formatNgn(p.amountNgn)}</span>,
        },
        {
          key: 'status',
          header: 'Status',
          render: (p) => <Badge color={getStatusColour(p.status)}>{p.status}</Badge>,
        },
        {
          key: 'date',
          header: 'Date',
          render: (p) => <span className="text-navy/50">{formatDate(p.createdAt)}</span>,
        },
      ]}
    />
  )
}
