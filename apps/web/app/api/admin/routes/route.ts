import { NextResponse, type NextRequest } from 'next/server'
import { MOCK_ROUTES } from '@/lib/mock-data'

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Number(searchParams.get('limit') ?? '10'))

  const total = MOCK_ROUTES.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const data = MOCK_ROUTES.slice(start, start + limit)

  return NextResponse.json({ data, meta: { total, page, limit, totalPages } })
}
