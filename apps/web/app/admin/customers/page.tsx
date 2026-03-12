'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AdminTable } from '@/components/admin/AdminTable'
import { fetcher, type Customer } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR<{ data: Customer[]; meta: { totalPages: number } }>(
    `/admin/customers?page=${page}&limit=20`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <AdminTable
      title="Customers"
      data={data?.data}
      isLoading={isLoading}
      totalPages={data?.meta?.totalPages}
      page={page}
      onPageChange={setPage}
      columns={[
        {
          key: 'name',
          header: 'Name',
          render: (c) => <span className="font-medium text-navy">{c.fullName}</span>,
        },
        {
          key: 'email',
          header: 'Email',
          render: (c) => <span className="text-navy/70">{c.email}</span>,
        },
        {
          key: 'phone',
          header: 'Phone',
          render: (c) => <span className="text-navy/60">{c.phone ?? '—'}</span>,
        },
        {
          key: 'bookings',
          header: 'Bookings',
          render: (c) => <span className="font-semibold text-navy">{c.bookingCount}</span>,
        },
        {
          key: 'joined',
          header: 'Joined',
          render: (c) => <span className="text-navy/50">{formatDate(c.createdAt)}</span>,
        },
      ]}
    />
  )
}
