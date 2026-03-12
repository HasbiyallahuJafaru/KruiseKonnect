'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import useSWR from 'swr'
import { AdminTable } from '@/components/admin/AdminTable'
import { Button } from '@/components/ui/Button'
import { fetcher, api, type Booking } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function AdminDocumentsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR<{ data: Booking[]; meta: { totalPages: number } }>(
    `/admin/bookings?status=confirmed&page=${page}&limit=20`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <AdminTable
      title="Documents"
      data={data?.data}
      isLoading={isLoading}
      totalPages={data?.meta?.totalPages}
      page={page}
      onPageChange={setPage}
      columns={[
        {
          key: 'reference',
          header: 'Booking',
          render: (b) => <span className="font-mono font-semibold text-navy">{b.reference}</span>,
        },
        {
          key: 'email',
          header: 'Email',
          render: (b) => <span className="text-navy/70">{b.contactEmail}</span>,
        },
        {
          key: 'date',
          header: 'Date',
          render: (b) => <span className="text-navy/50">{formatDate(b.createdAt)}</span>,
        },
        {
          key: 'itinerary',
          header: 'Itinerary',
          render: (b) => <DocumentLink bookingId={b.id} type="itinerary" />,
        },
        {
          key: 'receipt',
          header: 'Receipt',
          render: (b) => <DocumentLink bookingId={b.id} type="receipt" />,
        },
      ]}
    />
  )
}

function DocumentLink({ bookingId, type }: { bookingId: string; type: 'itinerary' | 'receipt' }) {
  const [loading, setLoading] = useState(false)

  async function open() {
    setLoading(true)
    try {
      const res = type === 'itinerary'
        ? await api.documents.getItineraryUrl(bookingId)
        : await api.documents.getReceiptUrl(bookingId)
      window.open(res.data.url, '_blank')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" loading={loading} onClick={open} className="gap-1 h-7 px-2">
      <ExternalLink size={11} /> View
    </Button>
  )
}
