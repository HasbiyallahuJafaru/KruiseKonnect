'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plane } from 'lucide-react'
import { api } from '@/lib/api'

interface PaymentPageProps {
  params: { reference: string }
}

export default function PaymentProcessingPage({ params }: PaymentPageProps) {
  const router = useRouter()
  const { reference } = params

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL

    const eventSource = new EventSource(
      `${API_BASE}/sse/payments/${reference}`,
      { withCredentials: true }
    )

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as { status: string; bookingId?: string }

      if (data.status === 'confirmed' && data.bookingId) {
        eventSource.close()
        router.push(`/booking/confirmation/${data.bookingId}`)
      }

      if (data.status === 'failed') {
        eventSource.close()
        router.push(`/dashboard/bookings?payment=failed`)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      // Fallback: poll verify once
      api.payments.verify(reference).then((res) => {
        if (res.data.status === 'success' && res.data.bookingId) {
          router.push(`/booking/confirmation/${res.data.bookingId}`)
        } else {
          router.push('/dashboard/bookings?payment=failed')
        }
      }).catch(() => {
        router.push('/dashboard/bookings')
      })
    }

    return () => eventSource.close()
  }, [reference, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="relative mb-8">
        <div className="h-20 w-20 rounded-full bg-sky-pale flex items-center justify-center">
          <Plane size={32} className="text-sky-accent -rotate-45 animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-sky-accent/30 animate-ping" />
      </div>

      <h1 className="text-xl font-bold text-navy mb-2">Processing payment</h1>
      <p className="text-navy/60 text-sm max-w-sm">
        Please wait while we confirm your payment. This usually takes a few seconds.
        Do not close this page.
      </p>
    </div>
  )
}
