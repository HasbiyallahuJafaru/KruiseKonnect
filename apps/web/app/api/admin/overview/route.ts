import { NextResponse } from 'next/server'
import { MOCK_ADMIN_OVERVIEW } from '@/lib/mock-data'

export function GET() {
  return NextResponse.json({ data: MOCK_ADMIN_OVERVIEW })
}
