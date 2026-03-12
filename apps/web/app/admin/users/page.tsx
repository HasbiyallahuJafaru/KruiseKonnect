'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AdminTable } from '@/components/admin/AdminTable'
import { Badge } from '@/components/ui/Badge'
import { fetcher, type Customer } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR<{ data: Customer[]; meta: { totalPages: number } }>(
    `/admin/customers?page=${page}&limit=20`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <AdminTable
      title="Users"
      data={data?.data}
      isLoading={isLoading}
      totalPages={data?.meta?.totalPages}
      page={page}
      onPageChange={setPage}
      columns={[
        {
          key: 'name',
          header: 'Name',
          render: (u) => <span className="font-medium text-navy">{u.fullName}</span>,
        },
        {
          key: 'email',
          header: 'Email',
          render: (u) => <span className="text-navy/70">{u.email}</span>,
        },
        {
          key: 'bookings',
          header: 'Bookings',
          render: (u) => <span className="font-semibold text-navy">{u.bookingCount}</span>,
        },
        {
          key: 'role',
          header: 'Role',
          render: () => <Badge color="gray">Customer</Badge>,
        },
        {
          key: 'joined',
          header: 'Joined',
          render: (u) => <span className="text-navy/50">{formatDate(u.createdAt)}</span>,
        },
      ]}
    />
  )
}
