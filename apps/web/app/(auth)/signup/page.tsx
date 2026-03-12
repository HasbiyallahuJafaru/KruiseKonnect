'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (authError) throw authError
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md text-center py-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mx-auto mb-4">
          <Mail size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-navy mb-2">Check your email</h2>
        <p className="text-sm text-navy/60 mb-6">
          We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <Button variant="ghost" onClick={() => router.push('/login')}>
          Back to sign in
        </Button>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Create your account</h1>
        <p className="mt-1 text-sm text-navy/60">
          Already have an account?{' '}
          <Link href="/login" className="text-sky-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Full name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ada Okafor"
          autoComplete="name"
          required
          leftIcon={<User size={14} />}
        />

        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          leftIcon={<Mail size={14} />}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-navy">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              className="w-full h-10 rounded-xl border border-navy/15 bg-white pl-9 pr-10 text-sm text-navy placeholder:text-navy/40 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-xs text-navy/50">Minimum 8 characters</p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>

        <p className="text-xs text-navy/40 text-center">
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline hover:text-navy/70">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-navy/70">Privacy Policy</Link>.
        </p>
      </form>
    </Card>
  )
}
