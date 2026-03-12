import { NextResponse } from 'next/server'
import { MOCK_FEATURED_ROUTES } from '@/lib/mock-data'

export function GET() {
  return NextResponse.json({ data: MOCK_FEATURED_ROUTES })
}
