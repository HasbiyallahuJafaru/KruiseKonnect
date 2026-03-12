import { NextResponse, type NextRequest } from 'next/server'
import { searchFlights } from '@/lib/mock-data'

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const origin = searchParams.get('origin') ?? ''
  const destination = searchParams.get('destination') ?? ''

  if (!origin || !destination) {
    return NextResponse.json({ data: [] })
  }

  const results = searchFlights(origin, destination)
  return NextResponse.json({ data: results })
}
