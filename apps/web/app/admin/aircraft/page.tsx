'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AdminTable } from '@/components/admin/AdminTable'
import { Badge } from '@/components/ui/Badge'
import { fetcher, type Aircraft } from '@/lib/api'

export default function AdminAircraftPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR<{ data: Aircraft[]; meta: { totalPages: number } }>(
    `/admin/aircraft?page=${page}&limit=20`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <AdminTable
      title="Aircraft"
      data={data?.data}
      isLoading={isLoading}
      totalPages={data?.meta?.totalPages}
      page={page}
      onPageChange={setPage}
      columns={[
        {
          key: 'name',
          header: 'Name',
          render: (a) => <span className="font-medium text-navy">{a.name}</span>,
        },
        {
          key: 'registration',
          header: 'Registration',
          render: (a) => <span className="font-mono text-navy/70">{a.registration}</span>,
        },
        {
          key: 'type',
          header: 'Type',
          render: (a) => <span className="text-navy/60">{a.type}</span>,
        },
        {
          key: 'seats',
          header: 'Seats',
          render: (a) => <span className="font-semibold text-navy">{a.totalSeats}</span>,
        },
        {
          key: 'status',
          header: 'Status',
          render: (a) => (
            <Badge color={a.isActive ? 'green' : 'gray'}>
              {a.isActive ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ]}
    />
  )
}
