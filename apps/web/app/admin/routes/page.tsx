'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AdminTable } from '@/components/admin/AdminTable'
import { Badge } from '@/components/ui/Badge'
import { fetcher, type Route } from '@/lib/api'

export default function AdminRoutesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR<{ data: Route[]; meta: { totalPages: number } }>(
    `/admin/routes?page=${page}&limit=20`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <AdminTable
      title="Routes"
      data={data?.data}
      isLoading={isLoading}
      totalPages={data?.meta?.totalPages}
      page={page}
      onPageChange={setPage}
      columns={[
        {
          key: 'route',
          header: 'Route',
          render: (r) => (
            <span className="font-mono font-semibold text-navy">
              {r.originCode} → {r.destinationCode}
            </span>
          ),
        },
        {
          key: 'origin',
          header: 'Origin',
          render: (r) => <span className="text-navy/70">{r.origin}</span>,
        },
        {
          key: 'destination',
          header: 'Destination',
          render: (r) => <span className="text-navy/70">{r.destination}</span>,
        },
        {
          key: 'status',
          header: 'Status',
          render: (r) => (
            <Badge color={r.isActive ? 'green' : 'gray'}>
              {r.isActive ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ]}
    />
  )
}
