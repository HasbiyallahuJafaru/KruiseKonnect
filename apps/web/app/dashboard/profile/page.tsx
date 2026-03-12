'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function ProfilePage() {
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name
      if (name) setFullName(name)
    })
  }, [supabase])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      })
      if (updateError) throw updateError
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy">Profile</h1>
        <p className="text-sm text-navy/60 mt-0.5">Manage your account details</p>
      </div>

      <Card className="max-w-lg">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-pale mb-5">
          <User size={24} className="text-sky-accent" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ada Okafor"
            required
          />

          {success && (
            <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              Profile updated successfully.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading}>
            Save changes
          </Button>
        </form>
      </Card>
    </div>
  )
}
