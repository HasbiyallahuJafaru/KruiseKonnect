'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { formatNgn } from '@/lib/utils'

interface PaystackButtonProps {
  bookingId: string
  amount: number
}

export function PaystackButton({ bookingId, amount }: PaystackButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setError('')
    setLoading(true)

    try {
      const res = await api.payments.initialize(bookingId)
      // Redirect to Paystack payment page
      window.location.href = res.data.authorizationUrl
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment initialisation failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}
      <Button
        onClick={handlePay}
        loading={loading}
        size="lg"
        className="w-full gap-2"
      >
        <CreditCard size={16} />
        Pay {formatNgn(amount)} with Paystack
      </Button>
    </div>
  )
}
