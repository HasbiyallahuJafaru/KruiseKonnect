'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
}

interface AdminTableProps<T> {
  title: string
  data: T[] | undefined
  columns: Column<T>[]
  isLoading: boolean
  totalPages?: number
  page: number
  onPageChange: (page: number) => void
  action?: React.ReactNode
}

export function AdminTable<T>({
  title,
  data,
  columns,
  isLoading,
  totalPages = 1,
  page,
  onPageChange,
  action,
}: AdminTableProps<T>) {
  if (isLoading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-navy">{title}</h1>
        {action}
      </div>

      <Card padding="none">
        {!data?.length ? (
          <EmptyState title="No data" description="Nothing to show yet." className="py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/8">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-5 py-3 text-left text-xs font-medium text-navy/50 whitespace-nowrap"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-chalk transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="px-5 py-3.5 whitespace-nowrap">
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft size={14} /> Previous
          </Button>
          <span className="text-xs text-navy/50">Page {page} of {totalPages}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Next <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}
